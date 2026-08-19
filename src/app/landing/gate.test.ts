// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterEach, describe, expect, it } from "vitest";
import { shouldSkipLanding } from "./gate.ts";

describe("shouldSkipLanding", () => {
  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("stays on the landing by default", () => {
    expect(shouldSkipLanding()).toBe(false);
  });

  it("opens the app only with an invite or ?app=1", () => {
    window.history.replaceState(null, "", "/#app");
    expect(shouldSkipLanding()).toBe(false);
    window.history.replaceState(null, "", "/?app=1");
    expect(shouldSkipLanding()).toBe(true);
  });
});
