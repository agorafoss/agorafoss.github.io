// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function publicCallsign(pubkey: string): string {
  const hex = pubkey.replace(/^0x/i, "").slice(0, 5);
  let value = Number.parseInt(hex, 16);
  if (Number.isNaN(value)) return "AG-0000";
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out = ALPHABET[value % 32] + out;
    value = Math.floor(value / 32);
  }
  return `AG-${out}`;
}
