// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { generateCadeado, maskCadeadoInput, normalizeCadeado } from "./cadeado.ts";
import { publicCallsign } from "./callsign.ts";

describe("cadeado", () => {
  it("generates an 8-char radio lock", () => {
    const lock = generateCadeado();
    expect(lock).toMatch(/^[0-9A-HJ-NP-TV-Z]{4}-[0-9A-HJ-NP-TV-Z]{4}$/);
    expect(normalizeCadeado(lock.toLowerCase().replace("-", " "))).toBe(lock);
  });

  it("masks typing and maps ambiguous letters", () => {
    expect(maskCadeadoInput("7k4mo2np")).toBe("7K4M-02NP");
    expect(() => normalizeCadeado("123")).toThrow("bad-cadeado");
  });
});

describe("public callsign", () => {
  it("is stable for the same pubkey", () => {
    const pk = "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcde";
    expect(publicCallsign(pk)).toBe(publicCallsign(pk));
    expect(publicCallsign(pk)).toMatch(/^AG-[0-9A-HJ-NP-TV-Z]{4}$/);
  });
});
