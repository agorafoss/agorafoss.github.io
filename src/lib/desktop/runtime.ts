// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export type DesktopInfo = {
  desktop: boolean;
  keystore: string;
};

const WEB: DesktopInfo = { desktop: false, keystore: "web-vault" };

export function isDesktopShell(): boolean {
  if (typeof window === "undefined") return false;
  const shell = window as Window & { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown };
  return Boolean(shell.__TAURI_INTERNALS__ || shell.__TAURI__);
}

export async function probeDesktop(): Promise<DesktopInfo> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const info = await invoke<DesktopInfo>("desktop_info");
    if (info?.desktop === true) {
      return { desktop: true, keystore: info.keystore || "web-vault" };
    }
  } catch {
    /* browser / Pages */
  }
  return WEB;
}
