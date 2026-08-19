// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { finalizeEvent, generateSecretKey } from "nostr-tools";
import { describe, expect, it } from "vitest";
import { STAGE_CONTENT, STAGE_KIND, verifyStageHello } from "./stage-handshake.ts";

function signedHello(kind = STAGE_KIND, content = STAGE_CONTENT) {
  return finalizeEvent(
    {
      kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content,
    },
    generateSecretKey(),
  );
}

describe("stage handshake", () => {
  it("accepts a signed agora-stage hello and returns the pubkey", () => {
    const hello = signedHello();
    expect(verifyStageHello(hello)).toBe(hello.pubkey);
  });

  it("rejects garbage, wrong kind, and a broken signature", () => {
    expect(verifyStageHello(null)).toBeNull();
    expect(verifyStageHello({ kind: 1, content: "hi" })).toBeNull();
    expect(verifyStageHello(signedHello(1, STAGE_CONTENT))).toBeNull();
    const broken = { ...signedHello(), id: "0".repeat(64), sig: "not-a-signature" };
    expect(verifyStageHello(broken)).toBeNull();
  });
});
