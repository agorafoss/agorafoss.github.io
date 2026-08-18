import { describe, expect, it } from "vitest";
import { emptyMuteList, isMuted, togglePubkey, toggleWord } from "./mute.ts";

describe("mute list", () => {
  it("hides a pubkey or a word only on the local list", () => {
    const muted = toggleWord(togglePubkey(emptyMuteList(), "aa"), "spam");
    expect(isMuted(muted, "aa", "oi")).toBe(true);
    expect(isMuted(muted, "bb", "isso é SPAM")).toBe(true);
    expect(isMuted(muted, "bb", "oi")).toBe(false);
  });

  it("toggles the same entry off", () => {
    const muted = togglePubkey(togglePubkey(emptyMuteList(), "aa"), "aa");
    expect(muted.pubkeys).toEqual([]);
  });
});
