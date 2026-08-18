// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { createIdentity } from "../nostr/keys.ts";
import { openSecret, sealSecret } from "./crypto.ts";

describe("vault crypto", () => {
  it("round-trips a secret with the right password", async () => {
    const identity = createIdentity();
    const sealed = await sealSecret(identity.secretKey, "correct horse");
    const opened = await openSecret(sealed, "correct horse");
    expect(Array.from(opened)).toEqual(Array.from(identity.secretKey));
    expect(sealed.ct).not.toContain(identity.pubkey);
  });

  it("names the missing Web Crypto as insecure-context", async () => {
    const identity = createIdentity();
    const original = globalThis.crypto.subtle;
    Object.defineProperty(globalThis.crypto, "subtle", { configurable: true, value: undefined });
    try {
      await expect(sealSecret(identity.secretKey, "x")).rejects.toThrow("insecure-context");
    } finally {
      Object.defineProperty(globalThis.crypto, "subtle", { configurable: true, value: original });
    }
  });

  it("rejects the wrong password", async () => {
    const identity = createIdentity();
    const sealed = await sealSecret(identity.secretKey, "correct horse");
    await expect(openSecret(sealed, "wrong password")).rejects.toThrow("bad-password");
  });
});
