// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import {
  AUDIO_MAX_BITRATE,
  MAX_STAGE_PEERS,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_TARGET_BITRATE,
  VIDEO_WIDTH,
  localMediaConstraints,
  stageIsFull,
  stagePassword,
  stageRoomId,
} from "./trystero-room.ts";

describe("trystero room rules", () => {
  it("namespaces the room by group id", () => {
    expect(stageRoomId("abc")).toBe("agora:abc");
    expect(stagePassword("abc")).toBe("agora-stage:abc");
    expect(stagePassword("abc", "  senha-secreta  ")).toBe("senha-secreta");
  });

  it("caps the stage at ten people including self", () => {
    expect(MAX_STAGE_PEERS).toBe(10);
    expect(stageIsFull(9)).toBe(false);
    expect(stageIsFull(10)).toBe(true);
    expect(stageIsFull(11)).toBe(true);
  });

  it("asks the camera for 720p30, not 360p", () => {
    const video = localMediaConstraints(true).video;
    expect(video).toEqual({
      width: { ideal: VIDEO_WIDTH },
      height: { ideal: VIDEO_HEIGHT },
      frameRate: { ideal: VIDEO_FPS },
    });
    expect(VIDEO_WIDTH).toBe(1280);
    expect(VIDEO_HEIGHT).toBe(720);
    expect(VIDEO_FPS).toBe(30);
    expect(VIDEO_TARGET_BITRATE).toBe(2_500_000);
    expect(AUDIO_MAX_BITRATE).toBe(64_000);
    expect(JSON.stringify(localMediaConstraints(true))).not.toMatch(/360/);
  });
});
