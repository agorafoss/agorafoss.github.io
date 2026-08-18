import { describe, expect, it } from "vitest";
import { encodeGroupInvite, looksLikeInvite, parseGroupInvite, readInviteFromLocation } from "./invite.ts";

describe("group invites", () => {
  it("round-trips an naddr with relay hint", async () => {
    const encoded = await encodeGroupInvite({
      id: "cafezinho",
      relay: "wss://groups.0xchat.com",
      name: "Café",
    });
    expect(encoded.startsWith("naddr1")).toBe(true);
    expect(parseGroupInvite(encoded)).toEqual({
      id: "cafezinho",
      relay: "wss://groups.0xchat.com",
    });
  });

  it("keeps the invite code outside the bech32", async () => {
    const encoded = await encodeGroupInvite(
      { id: "fechada", relay: "wss://groups.0xchat.com", name: "X" },
      "segredo",
    );
    expect(encoded).toContain("?invite=segredo");
    expect(parseGroupInvite(`nostr:${encoded}`).code).toBe("segredo");
  });

  it("still reads the old id @ relay paste", () => {
    expect(looksLikeInvite("abc @ wss://groups.fiatjaf.com")).toBe(true);
    expect(parseGroupInvite("abc @ wss://groups.fiatjaf.com/")).toEqual({
      id: "abc",
      relay: "wss://groups.fiatjaf.com",
    });
  });

  it("reads invite from a shareable URL", () => {
    expect(readInviteFromLocation("http://localhost:5173/?invite=naddr1qqqq")).toBe("naddr1qqqq");
    expect(readInviteFromLocation("http://localhost:5173/#nostr:naddr1abc")).toBe("nostr:naddr1abc");
  });
});
