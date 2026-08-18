import { describe, expect, it } from "vitest";
import {
  looksJpeg,
  looksPng,
  looksWebp,
  stripImageBytes,
  stripJpegMetadata,
  stripPngMetadata,
  stripWebpMetadata,
} from "./media-meta.ts";

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function ascii(text: string): number[] {
  return [...text].map((char) => char.charCodeAt(0));
}

function be32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function le32(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function crc32(data: Uint8Array): number[] {
  let crc = 0xffffffff;
  for (const value of data) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      const take = crc & 1;
      crc >>>= 1;
      if (take) crc ^= 0xedb88320;
    }
  }
  crc ^= 0xffffffff;
  return be32(crc >>> 0);
}

function pngChunk(type: string, data: number[]): number[] {
  const body = new Uint8Array([...ascii(type), ...data]);
  return [...be32(data.length), ...body, ...crc32(body)];
}

describe("strip image metadata", () => {
  it("drops JPEG APP1 (EXIF) and keeps the image", () => {
    const jpeg = bytes(
      0xff,
      0xd8,
      0xff,
      0xe1,
      0x00,
      0x0e,
      ...ascii("Exif"),
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0xff,
      0xda,
      0x00,
      0x02,
      0xaa,
      0xff,
      0xd9,
    );
    expect(looksJpeg(jpeg)).toBe(true);
    const clean = stripJpegMetadata(jpeg);
    expect(clean[0]).toBe(0xff);
    expect(clean[1]).toBe(0xd8);
    expect(clean[clean.length - 2]).toBe(0xff);
    expect(clean[clean.length - 1]).toBe(0xd9);
    expect([...clean]).toContain(0xda);
    expect(String.fromCharCode(...clean)).not.toContain("Exif");
  });

  it("drops PNG tEXt and eXIf chunks", () => {
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const ihdr = pngChunk("IHDR", new Array(13).fill(0));
    const text = pngChunk("tEXt", [...ascii("Comment"), 0x00, ...ascii("GPS")]);
    const exif = pngChunk("eXIf", ascii("fake-exif"));
    const iend = pngChunk("IEND", []);
    const png = bytes(...sig, ...ihdr, ...text, ...exif, ...iend);
    expect(looksPng(png)).toBe(true);
    const clean = stripPngMetadata(png);
    const asText = String.fromCharCode(...clean);
    expect(asText).toContain("IHDR");
    expect(asText).toContain("IEND");
    expect(asText).not.toContain("tEXt");
    expect(asText).not.toContain("eXIf");
    expect(asText).not.toContain("GPS");
  });

  it("drops WebP EXIF/XMP chunks and rewrites the RIFF size", () => {
    const vp8 = [...ascii("VP8 "), ...le32(4), 1, 2, 3, 4];
    const exif = [...ascii("EXIF"), ...le32(4), ...ascii("gps!")];
    const payload = [...vp8, ...exif];
    const webp = bytes(...ascii("RIFF"), ...le32(4 + payload.length), ...ascii("WEBP"), ...payload);
    expect(looksWebp(webp)).toBe(true);
    const clean = stripWebpMetadata(webp);
    expect(String.fromCharCode(...clean)).toContain("VP8 ");
    expect(String.fromCharCode(...clean)).not.toContain("EXIF");
    expect(String.fromCharCode(...clean)).not.toContain("gps!");
  });

  it("leaves unknown bytes alone", () => {
    const gif = bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
    expect(stripImageBytes(gif, "image/gif")).toBe(gif);
  });
});
