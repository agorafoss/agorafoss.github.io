// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from "zustand";
import { generateCadeado, looksLikeCadeado, normalizeCadeado } from "../../lib/nostr/cadeado.ts";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import { createSigner, getNdk, startNdk, stopNdk } from "../../lib/nostr/ndk.ts";
import { createMnemonicIdentity, identityFromMnemonic } from "../../lib/nostr/mnemonic.ts";
import { encodeNpub, encodeNsec } from "../../lib/nostr/nip19.ts";
import { hasNip07 } from "../../lib/nostr/nip07.ts";
import { claimPairing, startPairingSession } from "../../lib/nostr/pairing.ts";
import { identityFromSecret } from "../../lib/nostr/keys.ts";
import type { AuthMethod, Identity, ProfileDraft } from "../../lib/nostr/types.ts";
import {
  clearVault,
  readVault,
  saveLocalVault,
  saveNip07Marker,
  unlockLocalVault,
} from "../../lib/storage/keystore.ts";
import { clearBrowserSession, readBrowserSession, writeBrowserSession } from "../../lib/storage/session.ts";
import { useProfileStore } from "../profile/profile-store.ts";
import { useRelayStore } from "../relays/relay-store.ts";

export type AuthStatus = "loading" | "setup" | "locked" | "reveal" | "ready";

type Reveal = {
  cadeado: string;
  mnemonic: string | null;
  nsec: string | null;
};

type AuthState = {
  status: AuthStatus;
  method: AuthMethod | null;
  pubkey: string | null;
  npub: string | null;
  callsign: string | null;
  reveal: Reveal | null;
  error: string | null;
  fails: number;
  lockedUntil: number;
  pairingCode: string | null;
  pairingExpiresAt: number | null;
  hydrate: () => Promise<void>;
  createIndicativo: (name: string, picture: string) => Promise<void>;
  recoverMnemonic: (words: string, cadeado: string) => Promise<void>;
  claimPair: (code: string, cadeado: string) => Promise<void>;
  confirmReveal: () => Promise<void>;
  unlock: (cadeado: string) => Promise<void>;
  loginNip07: () => Promise<void>;
  importAdvanced: (secret: string, cadeado: string) => Promise<void>;
  startPairing: () => Promise<void>;
  stopPairing: () => void;
  lock: () => Promise<void>;
  forget: () => Promise<void>;
};

let liveIdentity: Identity | null = null;

export function getLiveIdentity(): Identity | null {
  return liveIdentity;
}
let pendingDraft: ProfileDraft = { name: "", picture: "" };

async function openSession(method: AuthMethod, identity?: Identity): Promise<string> {
  const urls = await useRelayStore.getState().loadSaved();
  const signer = createSigner(method, identity?.secretKey);
  await startNdk(urls, signer);
  useRelayStore.getState().attach();
  const ndkUser = await signer.user();
  const pubkey = identity?.pubkey ?? ndkUser.pubkey;
  liveIdentity = identity ?? null;
  if (pubkey) {
    await useProfileStore.getState().loadOwn(pubkey);
  }
  return pubkey;
}

function mapError(error: unknown): string {
  if (error instanceof Error) {
    const known = [
      "bad-password",
      "bad-cadeado",
      "bad-mnemonic",
      "no-local-vault",
      "no-nip07",
      "pair-not-found",
      "pair-expired",
      "name-required",
      "locked-out",
      "insecure-context",
    ];
    if (known.includes(error.message)) return error.message;
  }
  return "auth-failed";
}

async function persistLocal(identity: Identity, cadeado: string): Promise<void> {
  const lock = normalizeCadeado(cadeado);
  await saveLocalVault(identity, lock);
  writeBrowserSession(lock);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  method: null,
  pubkey: null,
  npub: null,
  callsign: null,
  reveal: null,
  error: null,
  fails: 0,
  lockedUntil: 0,
  pairingCode: null,
  pairingExpiresAt: null,

  hydrate: async () => {
    try {
      const vault = await readVault();
      if (!vault) {
        set({ status: "setup", method: null, pubkey: null, npub: null, callsign: null, error: null });
        return;
      }
      if (vault.method === "nip07" && hasNip07()) {
        await get().loginNip07();
        return;
      }
      const session = readBrowserSession();
      if (session && vault.method === "local") {
        try {
          const secret = looksLikeCadeado(session) ? normalizeCadeado(session) : session.trim();
          const { identity, callsign } = await unlockLocalVault(secret);
          await openSession("local", identity);
          writeBrowserSession(secret);
          set({
            status: "ready",
            method: "local",
            pubkey: identity.pubkey,
            npub: identity.npub,
            callsign,
            fails: 0,
            lockedUntil: 0,
            error: null,
          });
          return;
        } catch {
          clearBrowserSession();
        }
      }
      set({
        status: "locked",
        method: vault.method,
        pubkey: vault.pubkey,
        npub: vault.npub,
        callsign: vault.callsign ?? publicCallsign(vault.pubkey),
        error: null,
      });
    } catch {
      set({ status: "setup", error: null });
    }
  },

  createIndicativo: async (name, picture) => {
    set({ error: null });
    try {
      const trimmed = name.trim();
      if (trimmed.length < 2) throw new Error("name-required");
      const { mnemonic, identity } = createMnemonicIdentity();
      const cadeado = generateCadeado();
      pendingDraft = { name: trimmed, picture: picture.trim() };
      await persistLocal(identity, cadeado);
      await openSession("local", identity);
      set({
        status: "reveal",
        method: "local",
        pubkey: identity.pubkey,
        npub: identity.npub,
        callsign: publicCallsign(identity.pubkey),
        reveal: { cadeado, mnemonic, nsec: encodeNsec(identity.secretKey) },
        error: null,
      });
    } catch (error) {
      set({ error: mapError(error) });
    }
  },

  recoverMnemonic: async (words, cadeado) => {
    set({ error: null });
    try {
      const identity = identityFromMnemonic(words);
      await persistLocal(identity, cadeado);
      await openSession("local", identity);
      pendingDraft = { name: "", picture: "" };
      set({
        status: "ready",
        method: "local",
        pubkey: identity.pubkey,
        npub: identity.npub,
        callsign: publicCallsign(identity.pubkey),
        reveal: null,
        error: null,
      });
    } catch (error) {
      set({ error: mapError(error) });
    }
  },

  claimPair: async (code, cadeado) => {
    set({ error: null });
    try {
      const { identity, draft } = await claimPairing(code, await useRelayStore.getState().loadSaved());
      pendingDraft = draft;
      await persistLocal(identity, cadeado);
      await openSession("local", identity);
      if (draft.name || draft.picture) {
        await useProfileStore.getState().saveOwn({
          name: draft.name,
          displayName: draft.name,
          about: "",
          picture: draft.picture,
        });
      }
      pendingDraft = { name: "", picture: "" };
      set({
        status: "ready",
        method: "local",
        pubkey: identity.pubkey,
        npub: identity.npub,
        callsign: publicCallsign(identity.pubkey),
        reveal: null,
        error: null,
      });
    } catch (error) {
      set({ error: mapError(error) });
    }
  },

  confirmReveal: async () => {
    const pubkey = get().pubkey;
    if (pubkey && (pendingDraft.name || pendingDraft.picture)) {
      await useProfileStore.getState().saveOwn({
        name: pendingDraft.name,
        displayName: pendingDraft.name,
        about: "",
        picture: pendingDraft.picture,
      });
    }
    pendingDraft = { name: "", picture: "" };
    set({ status: "ready", reveal: null });
  },

  unlock: async (cadeado) => {
    const now = Date.now();
    if (get().lockedUntil > now) {
      set({ error: "locked-out" });
      return;
    }
    set({ error: null });
    try {
      const secret = looksLikeCadeado(cadeado) ? normalizeCadeado(cadeado) : cadeado.trim();
      const { identity, callsign } = await unlockLocalVault(secret);
      await openSession("local", identity);
      writeBrowserSession(secret);
      set({
        status: "ready",
        method: "local",
        pubkey: identity.pubkey,
        npub: identity.npub,
        callsign,
        fails: 0,
        lockedUntil: 0,
        error: null,
      });
    } catch (error) {
      const fails = get().fails + 1;
      const lockedUntil = fails >= 5 ? Date.now() + Math.min(15_000 * 2 ** (fails - 5), 120_000) : 0;
      set({ error: mapError(error), fails, lockedUntil });
    }
  },

  loginNip07: async () => {
    set({ error: null });
    try {
      if (!hasNip07()) throw new Error("no-nip07");
      const pubkey = await openSession("nip07");
      if (!pubkey) throw new Error("auth-failed");
      const npub = encodeNpub(pubkey);
      await saveNip07Marker(pubkey, npub);
      set({
        status: "ready",
        method: "nip07",
        pubkey,
        npub,
        callsign: publicCallsign(pubkey),
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error && error.message === "no-nip07" ? "no-nip07" : "auth-failed",
        status: (await readVault()) ? "locked" : "setup",
      });
    }
  },

  importAdvanced: async (secret, cadeado) => {
    set({ error: null });
    try {
      const identity = identityFromSecret(secret);
      pendingDraft = { name: "", picture: "" };
      await persistLocal(identity, cadeado);
      await openSession("local", identity);
      set({
        status: "ready",
        method: "local",
        pubkey: identity.pubkey,
        npub: identity.npub,
        callsign: publicCallsign(identity.pubkey),
        reveal: null,
        error: null,
      });
    } catch (error) {
      set({ error: mapError(error) });
    }
  },

  startPairing: async () => {
    set({ error: null });
    try {
      if (!liveIdentity) throw new Error("auth-failed");
      const profile = useProfileStore.getState().own;
      const { code, expiresAt } = await startPairingSession(getNdk(), liveIdentity, {
        name: profile.name || profile.displayName,
        picture: profile.picture,
      });
      set({ pairingCode: code, pairingExpiresAt: expiresAt });
    } catch (error) {
      set({ error: mapError(error) });
    }
  },

  stopPairing: () => set({ pairingCode: null, pairingExpiresAt: null }),

  lock: async () => {
    liveIdentity = null;
    clearBrowserSession();
    useRelayStore.getState().detach();
    await stopNdk();
    const vault = await readVault();
    set({
      status: vault ? "locked" : "setup",
      reveal: null,
      pairingCode: null,
      pairingExpiresAt: null,
      error: null,
    });
  },

  forget: async () => {
    liveIdentity = null;
    clearBrowserSession();
    useRelayStore.getState().detach();
    await stopNdk();
    await clearVault();
    set({
      status: "setup",
      method: null,
      pubkey: null,
      npub: null,
      callsign: null,
      reveal: null,
      pairingCode: null,
      pairingExpiresAt: null,
      error: null,
      fails: 0,
      lockedUntil: 0,
    });
  },
}));
