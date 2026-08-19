// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

const KEY = "agora.stage-secrets";

function readAll(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

export function readStageSecret(channelKey: string): string | null {
  const secret = readAll()[channelKey]?.trim();
  return secret || null;
}

export function writeStageSecret(channelKey: string, secret: string): void {
  const next = { ...readAll(), [channelKey]: secret.trim() };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function clearStageSecret(channelKey: string): void {
  const next = readAll();
  delete next[channelKey];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
