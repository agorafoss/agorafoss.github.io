import Dexie, { type Table } from "dexie";
import type { AuthMethod } from "../nostr/types.ts";
import type { SealedSecret } from "./crypto.ts";

export type VaultRecord = {
  id: "primary";
  method: AuthMethod;
  pubkey: string;
  npub: string;
  callsign: string;
  createdAt: number;
  sealed?: SealedSecret;
};

export type KvRecord = {
  key: string;
  value: unknown;
};

class AgoraDb extends Dexie {
  vault!: Table<VaultRecord, "primary">;
  kv!: Table<KvRecord, string>;

  constructor() {
    super("agora");
    this.version(1).stores({
      vault: "id",
      kv: "key",
    });
  }
}

export const db = new AgoraDb();
