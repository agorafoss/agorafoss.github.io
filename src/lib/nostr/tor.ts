// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export type TorSettings = {
  enabled: boolean;
  socksHost: string;
  socksPort: number;
  onionRelays: string[];
};

export const DEFAULT_TOR: TorSettings = {
  enabled: false,
  socksHost: "127.0.0.1",
  socksPort: 9050,
  onionRelays: [],
};

export function isOnionRelay(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".onion");
  } catch {
    return false;
  }
}

export function socksAddress(settings: TorSettings): string {
  return `${settings.socksHost}:${settings.socksPort}`;
}

/** O navegador não fala SOCKS. Mesmo no Tauri o NDK ainda não usa este endereço — Fase 7. */
export function torAvailableInBrowser(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function socksAppliedToNostr(): boolean {
  return false;
}
