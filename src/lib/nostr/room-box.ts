// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

/** Chat de texto com senha. A chave deriva uma vez; cada mensagem tem IV próprio. */

export const ROOM_BOX_PREFIX = "agora1.";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

const keys = new Map<string, CryptoKey>();

async function roomKey(password: string, roomId: string): Promise<CryptoKey> {
  const cacheKey = `${roomId}:${password}`;
  const hit = keys.get(cacheKey);
  if (hit) return hit;
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const salt = new TextEncoder().encode(`agora-room:${roomId}`);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 80_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  keys.set(cacheKey, key);
  return key;
}

export function isRoomBox(content: string): boolean {
  return content.startsWith(ROOM_BOX_PREFIX);
}

export async function sealRoomText(plain: string, password: string, roomId: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await roomKey(password, roomId);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    new TextEncoder().encode(plain),
  );
  const packed = new Uint8Array(12 + ct.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ct), 12);
  return ROOM_BOX_PREFIX + toBase64(packed);
}

export async function openRoomText(blob: string, password: string, roomId: string): Promise<string | null> {
  if (!isRoomBox(blob)) return blob;
  try {
    const packed = fromBase64(blob.slice(ROOM_BOX_PREFIX.length));
    if (packed.length < 13) return null;
    const iv = packed.slice(0, 12);
    const ct = packed.slice(12);
    const key = await roomKey(password, roomId);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv.buffer as ArrayBuffer }, key, ct.buffer as ArrayBuffer);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
