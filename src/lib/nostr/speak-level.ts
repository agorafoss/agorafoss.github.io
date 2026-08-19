// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

/** RMS → 0..4. 0 = silêncio. */
export function rmsToLevel(rms: number): number {
  if (rms < 0.035) return 0;
  if (rms < 0.06) return 1;
  if (rms < 0.1) return 2;
  if (rms < 0.16) return 3;
  return 4;
}

export function watchTalking(stream: MediaStream, onLevel: (level: number) => void): () => void {
  if (stream.getAudioTracks().length === 0) {
    onLevel(0);
    return () => undefined;
  }
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    onLevel(0);
    return () => undefined;
  }
  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.4;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let raf = 0;
  let last = -1;

  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const sample of data) {
      const n = (sample - 128) / 128;
      sum += n * n;
    }
    const level = rmsToLevel(Math.sqrt(sum / data.length));
    if (level !== last) {
      last = level;
      onLevel(level);
    }
    raf = window.requestAnimationFrame(tick);
  };
  void ctx.resume().then(() => {
    tick();
  });

  return () => {
    window.cancelAnimationFrame(raf);
    source.disconnect();
    void ctx.close();
  };
}
