// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { CREATE_RELAY, GROUP_RELAY, normalizeRelayUrl, relayCreatesGroupsOnWeb, sameRelayUrl } from "./relays.ts";

describe("relay urls", () => {
  it("accepts ws and wss and strips a trailing slash", () => {
    expect(normalizeRelayUrl("wss://relay.damus.io/")).toBe("wss://relay.damus.io");
    expect(normalizeRelayUrl("ws://127.0.0.1:7777")).toBe("ws://127.0.0.1:7777");
  });

  it("flags the fiatjaf relay as web-only create", () => {
    expect(relayCreatesGroupsOnWeb(GROUP_RELAY)).toBe(true);
    expect(relayCreatesGroupsOnWeb(CREATE_RELAY)).toBe(false);
  });

  it("treats a trailing slash as the same relay", () => {
    expect(sameRelayUrl("wss://groups.0xchat.com/", "wss://groups.0xchat.com")).toBe(true);
  });

  it("rejects http", () => {
    expect(() => normalizeRelayUrl("https://relay.damus.io")).toThrow("invalid-relay-url");
    expect(() => normalizeRelayUrl("not a url")).toThrow("invalid-relay-url");
  });
});
