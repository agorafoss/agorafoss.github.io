// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { decrypt, encrypt, getConversationKey } from "nostr-tools/nip44";
import { describe, expect, it } from "vitest";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { generateRoomSecret, roomKeyTag } from "./room-key.ts";

describe("room key", () => {
  it("makes a grouped random secret and a stable d-tag", () => {
    const a = generateRoomSecret();
    const b = generateRoomSecret();
    expect(a).toMatch(/^[0-9A-Z]{5}(?:-[0-9A-Z]{5}){3}$/);
    expect(a).not.toBe(b);
    expect(roomKeyTag("sala", "AA")).toBe("agora-rk:sala:aa");
  });

  it("round-trips a secret with NIP-44 between two keys", () => {
    const alice = generateSecretKey();
    const bob = generateSecretKey();
    const secret = generateRoomSecret();
    const boxed = encrypt(JSON.stringify({ v: 1, secret, room: "x" }), getConversationKey(alice, getPublicKey(bob)));
    const opened = JSON.parse(decrypt(boxed, getConversationKey(bob, getPublicKey(alice)))) as { secret: string };
    expect(opened.secret).toBe(secret);
  });
});
