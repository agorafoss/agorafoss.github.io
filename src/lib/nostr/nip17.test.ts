import { generateSecretKey, getPublicKey } from "nostr-tools";
import { wrapEvent, wrapManyEvents } from "nostr-tools/nip17";
import { describe, expect, it } from "vitest";
import { unwrapGift } from "./nip17.ts";

describe("nip17 gift wrap", () => {
  it("lets only the recipient read the rumor", () => {
    const sender = generateSecretKey();
    const recipient = generateSecretKey();
    const peer = getPublicKey(recipient);
    const wrap = wrapEvent(sender, { publicKey: peer }, "praça fechada");
    const opened = unwrapGift(wrap, recipient, peer);
    expect(opened?.content).toBe("praça fechada");
    expect(opened?.outgoing).toBe(false);
    expect(unwrapGift(wrap, generateSecretKey(), peer)).toBeNull();
  });

  it("jitters gift-wrap created_at so the relay cannot pair sender and recipient by the clock", () => {
    const sender = generateSecretKey();
    const recipient = generateSecretKey();
    const peer = getPublicKey(recipient);
    const wraps = wrapManyEvents(sender, [{ publicKey: peer }, { publicKey: getPublicKey(sender) }], "praça fechada");
    const now = Math.round(Date.now() / 1000);
    const twoDays = 2 * 24 * 60 * 60;
    expect(wraps.length).toBeGreaterThanOrEqual(2);
    for (const wrap of wraps) {
      expect(wrap.created_at).toBeLessThanOrEqual(now);
      expect(now - wrap.created_at).toBeLessThanOrEqual(twoDays + 2);
    }
    const sample = Array.from({ length: 12 }, () => wrapEvent(sender, { publicKey: peer }, "x").created_at);
    expect(new Set(sample).size).toBeGreaterThan(1);
  });
});
