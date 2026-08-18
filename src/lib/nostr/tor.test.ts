// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { DEFAULT_TOR, isOnionRelay, socksAddress, socksAppliedToNostr } from "./tor.ts";

describe("tor helpers", () => {
  it("detects onion relays and formats the socks address", () => {
    expect(isOnionRelay("ws://abc.onion")).toBe(true);
    expect(isOnionRelay("wss://relay.damus.io")).toBe(false);
    expect(socksAddress(DEFAULT_TOR)).toBe("127.0.0.1:9050");
    expect(socksAppliedToNostr()).toBe(false);
  });
});
