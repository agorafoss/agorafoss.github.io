import { publicCallsign } from "../nostr/callsign.ts";
import type { AuthMethod, Identity } from "../nostr/types.ts";
import { openSecret, sealSecret } from "./crypto.ts";
import { db, type VaultRecord } from "./db.ts";

export async function readVault(): Promise<VaultRecord | undefined> {
  return db.vault.get("primary");
}

export async function hasLocalVault(): Promise<boolean> {
  const vault = await readVault();
  return vault?.method === "local" && Boolean(vault.sealed);
}

export async function saveLocalVault(identity: Identity, password: string): Promise<VaultRecord> {
  const record: VaultRecord = {
    id: "primary",
    method: "local",
    pubkey: identity.pubkey,
    npub: identity.npub,
    callsign: publicCallsign(identity.pubkey),
    createdAt: Date.now(),
    sealed: await sealSecret(identity.secretKey, password),
  };
  await db.vault.put(record);
  return record;
}

export async function saveNip07Marker(pubkey: string, npub: string): Promise<VaultRecord> {
  const record: VaultRecord = {
    id: "primary",
    method: "nip07",
    pubkey,
    npub,
    callsign: publicCallsign(pubkey),
    createdAt: Date.now(),
  };
  await db.vault.put(record);
  return record;
}

export async function unlockLocalVault(
  password: string,
): Promise<{ identity: Identity; method: AuthMethod; callsign: string }> {
  const vault = await readVault();
  if (!vault?.sealed || vault.method !== "local") {
    throw new Error("no-local-vault");
  }
  const secretKey = await openSecret(vault.sealed, password);
  return {
    method: "local",
    identity: {
      secretKey,
      pubkey: vault.pubkey,
      npub: vault.npub,
    },
    callsign: vault.callsign || publicCallsign(vault.pubkey),
  };
}

export async function clearVault(): Promise<void> {
  await db.vault.delete("primary");
}

export async function readKv<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key);
  return row ? (row.value as T) : fallback;
}

export async function writeKv(key: string, value: unknown): Promise<void> {
  await db.kv.put({ key, value });
}
