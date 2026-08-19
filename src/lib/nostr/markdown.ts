// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

const TOKEN = "\u0000MD";

const IMAGE_EXT = "png|jpe?g|gif|webp|avif";
const VIDEO_EXT = "mp4|webm|ogv|mov";
const AUDIO_EXT = "mp3|wav|m4a|aac|flac|opus|ogg";
const URL = String.raw`https?:\/\/[^\s<]+`;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stash(parts: string[], html: string): string {
  parts.push(html);
  return `${TOKEN}${parts.length - 1}${TOKEN}`;
}

function restore(text: string, parts: string[]): string {
  return text.replace(new RegExp(`${TOKEN}(\\d+)${TOKEN}`, "g"), (_, index: string) => parts[Number(index)] ?? "");
}

function classifyUrl(url: string): "image" | "video" | "audio" | "link" {
  const clean = url.replace(/[),.;!?]+$/, "");
  if (new RegExp(`\\.(?:${IMAGE_EXT})(?:\\?.*)?$`, "i").test(clean)) return "image";
  if (new RegExp(`\\.(?:${VIDEO_EXT})(?:\\?.*)?$`, "i").test(clean)) return "video";
  if (new RegExp(`\\.(?:${AUDIO_EXT})(?:\\?.*)?$`, "i").test(clean)) return "audio";
  return "link";
}

function mediaTag(url: string): string {
  const href = escapeHtml(url);
  const kind = classifyUrl(url);
  if (kind === "image") {
    return `<img src="${href}" alt="" loading="lazy" />`;
  }
  if (kind === "video") {
    return `<video src="${href}" controls playsinline preload="none"></video>`;
  }
  if (kind === "audio") {
    return `<audio src="${href}" controls preload="metadata"></audio>`;
  }
  return `<a href="${href}" target="_blank" rel="noreferrer">${href}</a>`;
}

export function renderMarkdown(text: string): string {
  const parts: string[] = [];
  const escaped = escapeHtml(text);
  const withMarks = escaped
    .replace(/`([^`]+)`/g, (_, code: string) => stash(parts, `<code>${code}</code>`))
    .replace(/\*\*([^*]+)\*\*/g, (_, body: string) => stash(parts, `<strong>${body}</strong>`))
    .replace(new RegExp(URL, "gi"), (url) => stash(parts, mediaTag(url)));
  return restore(withMarks, parts);
}
