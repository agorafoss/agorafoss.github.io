// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export function hasNip07(): boolean {
  return typeof window !== "undefined" && Boolean(window.nostr?.getPublicKey);
}
