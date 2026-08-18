// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { generateSeedWords, privateKeyFromSeedWords, validateWords } from "nostr-tools/nip06";
import { getPublicKey } from "nostr-tools";
import { encodeNpub } from "./nip19.ts";
import type { Identity } from "./types.ts";

export function normalizeMnemonic(input: string): string {
  return input.trim().toLowerCase().split(/\s+/).filter(Boolean).join(" ");
}

export function createMnemonicIdentity(): { mnemonic: string; identity: Identity } {
  const mnemonic = generateSeedWords();
  return { mnemonic, identity: identityFromMnemonic(mnemonic) };
}

export function identityFromMnemonic(input: string): Identity {
  const mnemonic = normalizeMnemonic(input);
  if (!validateWords(mnemonic)) {
    throw new Error("bad-mnemonic");
  }
  const secretKey = privateKeyFromSeedWords(mnemonic);
  const pubkey = getPublicKey(secretKey);
  return {
    secretKey,
    pubkey,
    npub: encodeNpub(pubkey),
  };
}

export function splitMnemonic(mnemonic: string): string[] {
  return normalizeMnemonic(mnemonic).split(" ");
}
