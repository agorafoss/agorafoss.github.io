// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export const CHAT_EMOJI = [
  "🔥",
  "👋",
  "❤️",
  "😂",
  "👍",
  "👎",
  "😮",
  "😢",
  "🙏",
  "🎉",
  "⚡",
  "✨",
  "🫡",
  "🤝",
  "💯",
  "👀",
  "🗣️",
  "📻",
  "🔒",
  "🗝️",
  "📣",
  "🌙",
  "☀️",
  "☕",
] as const;

export function openMojiUrl(emoji: string): string {
  const hex = [...emoji]
    .map((char) => char.codePointAt(0)?.toString(16).toUpperCase())
    .filter(Boolean)
    .join("-");
  return `https://cdn.jsdelivr.net/npm/openmoji@14.0.0/color/svg/${hex}.svg`;
}
