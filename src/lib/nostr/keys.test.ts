// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { createIdentity, exportNsec, identityFromSecret } from "./keys.ts";
import { decodeNpub, decodeNsec, encodeNpub, shortenNpub } from "./nip19.ts";

describe("nostr keys", () => {
  it("generates a keypair that round-trips through nsec and npub", () => {
    const identity = createIdentity();
    expect(identity.pubkey).toHaveLength(64);
    expect(identity.npub.startsWith("npub1")).toBe(true);

    const nsec = exportNsec(identity);
    expect(nsec.startsWith("nsec1")).toBe(true);

    const imported = identityFromSecret(nsec);
    expect(imported.pubkey).toBe(identity.pubkey);
    expect(imported.npub).toBe(identity.npub);
    expect(Array.from(imported.secretKey)).toEqual(Array.from(identity.secretKey));
  });

  it("imports a 64-char hex secret", () => {
    const identity = createIdentity();
    const hex = Array.from(identity.secretKey, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const imported = identityFromSecret(hex);
    expect(imported.npub).toBe(identity.npub);
  });

  it("rejects garbage", () => {
    expect(() => identityFromSecret("not-a-key")).toThrow();
    expect(() => decodeNsec("nsec1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsdv2j2n")).toThrow();
  });

  it("encodes and shortens npub", () => {
    const identity = createIdentity();
    expect(decodeNpub(encodeNpub(identity.pubkey))).toBe(identity.pubkey);
    expect(shortenNpub(identity.npub)).toMatch(/^npub1.+\u2026[a-z0-9]{4}$/);
  });
});
