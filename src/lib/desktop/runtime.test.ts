// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { probeDesktop } from "./runtime.ts";

describe("probeDesktop", () => {
  it("falls back to the web client when Tauri is not there", async () => {
    await expect(probeDesktop()).resolves.toEqual({ desktop: false, keystore: "web-vault" });
  });
});
