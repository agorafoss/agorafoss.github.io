// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

/** DeepFilterNet 3 no mic deste PC. Wasm e modelo saem desta origem (~24 MB). */

export function clarityCdnUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}deepfilternet3`.replace(/\/{2,}/g, "/");
}

export type ClarityPrefs = {
  enabled: boolean;
  suppression: number;
};

export const CLARITY_DEFAULTS: ClarityPrefs = {
  enabled: true,
  suppression: 60,
};

export function clampSuppression(value: number): number {
  if (!Number.isFinite(value)) return CLARITY_DEFAULTS.suppression;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function parseClarityPrefs(raw: unknown): ClarityPrefs {
  if (!raw || typeof raw !== "object") return { ...CLARITY_DEFAULTS };
  const row = raw as Record<string, unknown>;
  return {
    enabled: row.enabled !== false,
    suppression: clampSuppression(typeof row.suppression === "number" ? row.suppression : CLARITY_DEFAULTS.suppression),
  };
}

export type ClarityHandle = {
  stream: MediaStream;
  setSuppression: (level: number) => void;
  setEnabled: (on: boolean) => void;
  destroy: () => void;
};

export async function openClarity(raw: MediaStream, suppression: number): Promise<ClarityHandle> {
  const { DeepFilterNet3Core } = await import("deepfilternet3-noise-filter");
  const ctx = new AudioContext({ sampleRate: 48000 });
  const proc = new DeepFilterNet3Core({
    sampleRate: 48000,
    noiseReductionLevel: clampSuppression(suppression),
    assetConfig: { cdnUrl: clarityCdnUrl() },
  });
  await proc.initialize();
  const node = await proc.createAudioWorkletNode(ctx);
  const src = ctx.createMediaStreamSource(raw);
  const dst = ctx.createMediaStreamDestination();
  src.connect(node);
  node.connect(dst);
  proc.setSuppressionLevel(clampSuppression(suppression));
  proc.setNoiseSuppressionEnabled(true);
  await ctx.resume();
  return {
    stream: dst.stream,
    setSuppression: (level) => proc.setSuppressionLevel(clampSuppression(level)),
    setEnabled: (on) => proc.setNoiseSuppressionEnabled(on),
    destroy: () => {
      try {
        src.disconnect();
        node.disconnect();
      } catch {
        /* already gone */
      }
      proc.destroy();
      void ctx.close();
    },
  };
}
