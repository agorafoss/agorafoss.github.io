// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { createMnemonicIdentity, identityFromMnemonic, splitMnemonic } from "./mnemonic.ts";

describe("nip06 mnemonic", () => {
  it("round-trips twelve words into the same key", () => {
    const { mnemonic, identity } = createMnemonicIdentity();
    expect(splitMnemonic(mnemonic)).toHaveLength(12);
    const restored = identityFromMnemonic(mnemonic);
    expect(restored.pubkey).toBe(identity.pubkey);
    expect(Array.from(restored.secretKey)).toEqual(Array.from(identity.secretKey));
  });

  it("rejects a broken phrase", () => {
    expect(() => identityFromMnemonic("not a real recovery phrase at all here now")).toThrow("bad-mnemonic");
  });
});
