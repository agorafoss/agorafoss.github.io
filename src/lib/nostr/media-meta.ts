const JPEG_SOI = 0xffd8;
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function be16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function be32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

function le32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function writeLe32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function looksJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && be16(bytes, 0) === JPEG_SOI;
}

export function looksPng(bytes: Uint8Array): boolean {
  return bytes.length >= 8 && PNG_SIG.every((value, i) => bytes[i] === value);
}

export function looksWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 4) === "WEBP"
  );
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** APP1 (EXIF/XMP), APP13 (IPTC) e COM. GPS mora no APP1. */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (!looksJpeg(bytes)) return bytes;
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  let i = 2;
  while (i + 1 < bytes.length) {
    if (bytes[i] !== 0xff) {
      parts.push(bytes.subarray(i));
      break;
    }
    const markStart = i;
    i += 1;
    while (i < bytes.length && bytes[i] === 0xff) i += 1;
    if (i >= bytes.length) break;
    const marker = bytes[i];
    i += 1;
    if (marker === 0xd9) {
      parts.push(new Uint8Array([0xff, 0xd9]));
      break;
    }
    if (marker === 0xda) {
      parts.push(bytes.subarray(markStart));
      break;
    }
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(new Uint8Array([0xff, marker]));
      continue;
    }
    if (i + 1 >= bytes.length) break;
    const length = be16(bytes, i);
    if (length < 2 || i + length > bytes.length) break;
    const drop = marker === 0xe1 || marker === 0xed || marker === 0xfe;
    if (!drop) parts.push(bytes.subarray(markStart, i + length));
    i += length;
  }
  return concat(parts);
}

const PNG_DROP = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

export function stripPngMetadata(bytes: Uint8Array): Uint8Array {
  if (!looksPng(bytes)) return bytes;
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= bytes.length) {
    const length = be32(bytes, i);
    const type = ascii(bytes, i + 4, 4);
    const end = i + 12 + length;
    if (end > bytes.length) break;
    if (!PNG_DROP.has(type)) parts.push(bytes.subarray(i, end));
    i = end;
    if (type === "IEND") break;
  }
  return concat(parts);
}

export function stripWebpMetadata(bytes: Uint8Array): Uint8Array {
  if (!looksWebp(bytes)) return bytes;
  const kept: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= bytes.length) {
    const type = ascii(bytes, i, 4);
    const size = le32(bytes, i + 4);
    let end = i + 8 + size;
    if (size % 2 === 1) end += 1;
    if (end > bytes.length) break;
    if (type !== "EXIF" && type !== "XMP ") kept.push(bytes.subarray(i, end));
    i = end;
  }
  const payload = kept.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(12 + payload);
  out.set(bytes.subarray(0, 12));
  writeLe32(out, 4, 4 + payload);
  let offset = 12;
  for (const chunk of kept) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export function stripImageBytes(bytes: Uint8Array, mime = ""): Uint8Array {
  const type = mime.toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg" || looksJpeg(bytes)) return stripJpegMetadata(bytes);
  if (type === "image/png" || looksPng(bytes)) return stripPngMetadata(bytes);
  if (type === "image/webp" || looksWebp(bytes)) return stripWebpMetadata(bytes);
  return bytes;
}

/** Tira EXIF/IPTC/XMP/texto. GIF e AVIF passam intactos (re-encode quebraria animação). */
export async function stripImageMetadata(file: File): Promise<File> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const next = stripImageBytes(bytes, file.type);
  if (sameBytes(bytes, next)) return file;
  const copy = new ArrayBuffer(next.byteLength);
  new Uint8Array(copy).set(next);
  return new File([copy], file.name, { type: file.type || "application/octet-stream", lastModified: file.lastModified });
}
