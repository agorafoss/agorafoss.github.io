export type HexPubkey = string;
export type HexSecret = string;

export type Identity = {
  secretKey: Uint8Array;
  pubkey: HexPubkey;
  npub: string;
};

export type ProfileDraft = {
  name: string;
  picture: string;
};

export type AuthMethod = "local" | "nip07";

export type RelayStatus = "disconnected" | "connecting" | "connected" | "error";

export type RelayInfo = {
  url: string;
  status: RelayStatus;
};

export type UserProfile = {
  name: string;
  about: string;
  picture: string;
  displayName: string;
};
