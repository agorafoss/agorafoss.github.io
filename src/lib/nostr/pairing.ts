// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import NDK, { NDKEvent } from "@nostr-dev-kit/ndk";
import { bytesToHex, hexToBytes } from "./keys.ts";
import { KIND_APP_DATA } from "./kinds.ts";
import { generateCadeado, normalizeCadeado } from "./cadeado.ts";
import { withReadOnlyNdk } from "./ndk.ts";
import { DEFAULT_RELAYS } from "./relays.ts";
import type { Identity, ProfileDraft } from "./types.ts";
import { openSecret, sealSecret } from "../storage/crypto.ts";

export const PAIRING_TTL_MS = 5 * 60 * 1000;

type PairingPayload = {
  secretHex: string;
  name: string;
  picture: string;
  exp: number;
};

export async function pairingDTag(code: string): Promise<string> {
  const normalized = normalizeCadeado(code);
  const data = new TextEncoder().encode(`agora-pair-v1:${normalized}`);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return bytesToHex(hash).slice(0, 16);
}

export async function startPairingSession(
  ndk: NDK,
  identity: Identity,
  draft: ProfileDraft,
): Promise<{ code: string; expiresAt: number }> {
  const code = generateCadeado();
  const expiresAt = Date.now() + PAIRING_TTL_MS;
  const payload: PairingPayload = {
    secretHex: bytesToHex(identity.secretKey),
    name: draft.name,
    picture: draft.picture,
    exp: expiresAt,
  };
  const sealed = await sealSecret(new TextEncoder().encode(JSON.stringify(payload)), code);
  const event = new NDKEvent(ndk);
  event.kind = KIND_APP_DATA;
  event.content = JSON.stringify({ v: 1, sealed });
  event.tags = [
    ["d", await pairingDTag(code)],
    ["expiration", String(Math.floor(expiresAt / 1000))],
  ];
  await event.publish();
  return { code, expiresAt };
}

export async function claimPairing(code: string, relays = DEFAULT_RELAYS): Promise<{
  identity: Identity;
  draft: ProfileDraft;
}> {
  const normalized = normalizeCadeado(code);
  const dTag = await pairingDTag(normalized);
  const event = await withReadOnlyNdk(relays, async (ndk) => {
    const found = await ndk.fetchEvent({ kinds: [KIND_APP_DATA], "#d": [dTag] });
    return found;
  });
  if (!event) {
    throw new Error("pair-not-found");
  }
  let sealed: Parameters<typeof openSecret>[0];
  try {
    sealed = (JSON.parse(event.content) as { sealed: Parameters<typeof openSecret>[0] }).sealed;
  } catch {
    throw new Error("pair-not-found");
  }
  const opened = await openSecret(sealed, normalized);
  const payload = JSON.parse(new TextDecoder().decode(opened)) as PairingPayload;
  if (payload.exp < Date.now()) {
    throw new Error("pair-expired");
  }
  const { encodeNpub } = await import("./nip19.ts");
  const secretKey = hexToBytes(payload.secretHex);
  const { getPublicKey } = await import("nostr-tools");
  const pubkey = getPublicKey(secretKey);
  return {
    identity: { secretKey, pubkey, npub: encodeNpub(pubkey) },
    draft: { name: payload.name, picture: payload.picture },
  };
}
