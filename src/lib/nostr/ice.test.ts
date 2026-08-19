// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { CLOUDFLARE_STUN, ICE_TRANSPORT_POLICY, mediaIceServers, mediaPeerConfig } from "./ice.ts";

describe("ICE policy", () => {
  it("accepts host candidates and does not phone Google STUN", () => {
    expect(ICE_TRANSPORT_POLICY).toBe("all");
    expect(mediaIceServers()).toEqual([{ urls: [CLOUDFLARE_STUN] }]);
    expect(mediaPeerConfig().iceServers).toEqual([{ urls: [CLOUDFLARE_STUN] }]);
    expect(JSON.stringify(mediaPeerConfig())).not.toMatch(/google/i);
  });
});
