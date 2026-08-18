import { bytesToHex } from "./keys.ts";
import { stripImageMetadata } from "./media-meta.ts";
import { signBlossomAuth } from "./nip98.ts";

export const DEFAULT_BLOSSOM = "https://blossom.primal.net";

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hash));
}

export function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url);
}

export async function uploadBlob(file: File, server = DEFAULT_BLOSSOM): Promise<string> {
  const clean = await stripImageMetadata(file);
  const body = await clean.arrayBuffer();
  const hash = await sha256Hex(body);
  const base = server.replace(/\/+$/, "");
  const auth = await signBlossomAuth(hash, "upload");
  const response = await fetch(`${base}/upload`, {
    method: "PUT",
    headers: {
      Authorization: auth,
      "Content-Type": clean.type || file.type || "application/octet-stream",
    },
    body,
  });
  if (!response.ok) {
    throw new Error("blossom-upload-failed");
  }
  const json = (await response.json()) as { url?: string };
  if (!json.url) throw new Error("blossom-upload-failed");
  return json.url;
}
