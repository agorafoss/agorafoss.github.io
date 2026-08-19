// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { playbackKind } from "./whip.ts";

describe("live playback", () => {
  it("detects WHEP, HLS and a plain URL", () => {
    expect(playbackKind("http://localhost:8889/live/agora/whep")).toBe("whep");
    expect(playbackKind("https://media.example/live/stream/index.m3u8")).toBe("hls");
    expect(playbackKind("https://media.example/watch")).toBe("url");
  });
});
