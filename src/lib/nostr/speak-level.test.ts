// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { rmsToLevel } from "./speak-level.ts";

describe("speak level", () => {
  it("stays quiet under the floor and climbs to 4", () => {
    expect(rmsToLevel(0)).toBe(0);
    expect(rmsToLevel(0.02)).toBe(0);
    expect(rmsToLevel(0.05)).toBe(1);
    expect(rmsToLevel(0.2)).toBe(4);
  });
});
