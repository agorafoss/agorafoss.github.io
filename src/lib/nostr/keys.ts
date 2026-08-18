// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { generateSecretKey, getPublicKey } from "nostr-tools";
import { decodeNsec, encodeNpub, encodeNsec } from "./nip19.ts";
import type { Identity } from "./types.ts";

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    throw new Error("invalid-hex-secret");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function createIdentity(): Identity {
  const secretKey = generateSecretKey();
  const pubkey = getPublicKey(secretKey);
  return {
    secretKey,
    pubkey,
    npub: encodeNpub(pubkey),
  };
}

export function identityFromSecret(input: string): Identity {
  const trimmed = input.trim();
  const secretKey = trimmed.startsWith("nsec1") ? decodeNsec(trimmed) : hexToBytes(trimmed);
  const pubkey = getPublicKey(secretKey);
  return {
    secretKey,
    pubkey,
    npub: encodeNpub(pubkey),
  };
}

export function exportNsec(identity: Identity): string {
  return encodeNsec(identity.secretKey);
}

export function assertPassword(password: string, confirm?: string): void {
  if (password.length < 8) {
    throw new Error("password-too-short");
  }
  if (confirm !== undefined && password !== confirm) {
    throw new Error("password-mismatch");
  }
}
