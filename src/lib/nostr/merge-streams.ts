// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

/** Mic e câmera chegam em streams separados no Trystero. Sem merge, o vídeo apaga o áudio. */
export function mergeStreams(current: MediaStream | null, incoming: MediaStream | null): MediaStream | null {
  if (!incoming) return current;
  if (!current) return incoming;
  const ids = new Set(current.getTracks().map((track) => track.id));
  const next = new MediaStream(current.getTracks());
  for (const track of incoming.getTracks()) {
    if (!ids.has(track.id)) next.addTrack(track);
  }
  return next;
}
