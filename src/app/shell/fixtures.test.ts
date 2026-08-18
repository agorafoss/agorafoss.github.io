// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { findChannel, findServer, servers } from "./fixtures.ts";

describe("server fixtures", () => {
  it("builds a channel tree for the demo square", () => {
    const oficina = findServer("oficina");
    expect(oficina).toBeDefined();
    expect(oficina?.categories).toHaveLength(2);
    expect(findChannel(oficina, "geral")?.kind).toBe("text");
    expect(findChannel(oficina, "palco")?.kind).toBe("voice");
  });

  it("keeps at least one server with messages", () => {
    const withChat = servers.some((server) =>
      Object.values(server.messages).some((thread) => thread.length > 0),
    );
    expect(withChat).toBe(true);
  });
});
