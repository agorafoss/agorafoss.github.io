// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export const TRYSTERO_APP_ID = "agorafoss";
export const MAX_STAGE_PEERS = 10;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;
export const VIDEO_TARGET_BITRATE = 2_500_000;
export const AUDIO_MAX_BITRATE = 64_000;

export function stageRoomId(groupId: string): string {
  return `agora:${groupId}`;
}

export function stagePassword(groupId: string, secret?: string | null): string {
  const trimmed = secret?.trim();
  if (trimmed) return trimmed;
  return `agora-stage:${groupId}`;
}

/** Signaling do palco: kinds 20xxx. Relays NIP-29 pedem tag `h`; purplepag.es recusa o kind; Damus rate-limita. */
export const STAGE_SIGNAL_RELAYS = ["wss://nos.lol", "wss://relay.primal.net", "wss://relay.nostr.band"] as const;

export function stageSignalRelays(_pool: string[] = []): string[] {
  return [...STAGE_SIGNAL_RELAYS];
}

export function localMediaConstraints(video: boolean, browserDenoise = true): MediaStreamConstraints {
  const camera = {
    width: { ideal: VIDEO_WIDTH },
    height: { ideal: VIDEO_HEIGHT },
    frameRate: { ideal: VIDEO_FPS },
  };
  if (video) {
    return { audio: false, video: camera };
  }
  return {
    audio: { echoCancellation: true, noiseSuppression: browserDenoise, autoGainControl: true },
    video: false,
  };
}

export function screenConstraints(): DisplayMediaStreamOptions {
  return {
    audio: false,
    video: {
      width: { ideal: VIDEO_WIDTH },
      height: { ideal: VIDEO_HEIGHT },
      frameRate: { ideal: VIDEO_FPS },
    },
  };
}

export function stageIsFull(peerCount: number): boolean {
  return peerCount >= MAX_STAGE_PEERS;
}

export async function applyBitrateCap(pc: RTCPeerConnection): Promise<void> {
  for (const sender of pc.getSenders()) {
    if (!sender.track) continue;
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }
    const max = sender.track.kind === "audio" ? AUDIO_MAX_BITRATE : VIDEO_TARGET_BITRATE;
    for (const encoding of params.encodings) {
      encoding.maxBitrate = max;
    }
    await sender.setParameters(params).catch(() => undefined);
  }
}
