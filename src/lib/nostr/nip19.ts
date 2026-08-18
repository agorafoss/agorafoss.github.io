// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { nip19 } from "nostr-tools";

export function encodeNpub(pubkey: string): string {
  return nip19.npubEncode(pubkey);
}

export function encodeNsec(secretKey: Uint8Array): string {
  return nip19.nsecEncode(secretKey);
}

export function decodeNpub(npub: string): string {
  const decoded = nip19.decode(npub.trim());
  if (decoded.type !== "npub") {
    throw new Error("not-an-npub");
  }
  return decoded.data;
}

export function decodeNsec(nsec: string): Uint8Array {
  const decoded = nip19.decode(nsec.trim());
  if (decoded.type !== "nsec") {
    throw new Error("not-an-nsec");
  }
  return decoded.data;
}

export function shortenNpub(npub: string): string {
  if (npub.length < 16) return npub;
  return `${npub.slice(0, 10)}…${npub.slice(-4)}`;
}

export function hueFromPubkey(pubkey: string): number {
  const slice = pubkey.replace(/^0x/, "").slice(0, 4);
  const n = Number.parseInt(slice, 16);
  if (Number.isNaN(n)) return 32;
  return n % 360;
}
