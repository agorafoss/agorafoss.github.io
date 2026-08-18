// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const CADEADO_LENGTH = 8;

function randomChars(count: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(count));
  let out = "";
  for (const byte of bytes) {
    out += ALPHABET[byte % 32];
  }
  return out;
}

export function generateCadeado(): string {
  const raw = randomChars(CADEADO_LENGTH);
  return formatCadeado(raw);
}

export function formatCadeado(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export function looksLikeCadeado(input: string): boolean {
  const cleaned = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  return cleaned.length === CADEADO_LENGTH;
}

export function normalizeCadeado(input: string): string {
  const cleaned = input
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V")
    .replace(/[^0-9A-Z]/g, "");
  if (cleaned.length !== CADEADO_LENGTH) {
    throw new Error("bad-cadeado");
  }
  return formatCadeado(cleaned);
}

export function maskCadeadoInput(input: string): string {
  const cleaned = input
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V")
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, CADEADO_LENGTH);
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}
