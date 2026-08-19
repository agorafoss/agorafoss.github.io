// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from "zustand";
import {
  CLARITY_DEFAULTS,
  clampSuppression,
  parseClarityPrefs,
  type ClarityPrefs,
} from "../../lib/nostr/voice-clarity.ts";

const KEY = "agora.voice-clarity";

export type ClarityStatus = "idle" | "loading" | "ready" | "failed";

type ClarityState = ClarityPrefs & {
  status: ClarityStatus;
  setEnabled: (enabled: boolean) => void;
  setSuppression: (suppression: number) => void;
  setStatus: (status: ClarityStatus) => void;
};

function persist(prefs: ClarityPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}

function load(): ClarityPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...CLARITY_DEFAULTS };
    return parseClarityPrefs(JSON.parse(raw) as unknown);
  } catch {
    return { ...CLARITY_DEFAULTS };
  }
}

const start = load();

export const useClarityStore = create<ClarityState>((set, get) => ({
  ...start,
  status: "idle",
  setEnabled: (enabled) => {
    persist({ enabled, suppression: get().suppression });
    set({ enabled });
  },
  setSuppression: (suppression) => {
    const next = clampSuppression(suppression);
    persist({ enabled: get().enabled, suppression: next });
    set({ suppression: next });
  },
  setStatus: (status) => set({ status }),
}));
