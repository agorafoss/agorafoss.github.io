// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { CLARITY_DEFAULTS, clarityCdnUrl, clampSuppression, parseClarityPrefs } from "./voice-clarity.ts";

describe("voice clarity prefs", () => {
  it("clamps the suppression slider and fills defaults", () => {
    expect(clampSuppression(-4)).toBe(0);
    expect(clampSuppression(140)).toBe(100);
    expect(clampSuppression(47.4)).toBe(47);
    expect(parseClarityPrefs(null)).toEqual(CLARITY_DEFAULTS);
    expect(parseClarityPrefs({ enabled: false, suppression: 80 })).toEqual({ enabled: false, suppression: 80 });
  });

  it("loads wasm and the ONNX archive from this origin, not Mezon CDN", () => {
    expect(clarityCdnUrl()).toBe("/deepfilternet3");
  });
});
