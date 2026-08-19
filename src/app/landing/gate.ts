// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readInviteFromLocation } from "../../lib/nostr/invite.ts";

const GATE_KEY = "agora.gate";

export function shouldSkipLanding(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("app") === "1") return true;
    if (readInviteFromLocation()) return true;
  } catch {
    return false;
  }
  return false;
}

export function enterAppGate(): void {
  window.sessionStorage.setItem(GATE_KEY, "app");
}

export function leaveAppGate(): void {
  window.sessionStorage.removeItem(GATE_KEY);
  const url = new URL(window.location.href);
  if (url.hash === "#app" || url.hash === "#entrar") url.hash = "";
  url.searchParams.delete("app");
  window.history.replaceState(null, "", url);
}
