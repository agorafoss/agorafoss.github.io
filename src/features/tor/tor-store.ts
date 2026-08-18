// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from "zustand";
import { DEFAULT_TOR, isOnionRelay, torAvailableInBrowser, type TorSettings } from "../../lib/nostr/tor.ts";
import { readKv, writeKv } from "../../lib/storage/keystore.ts";

const TOR_KEY = "tor";

type TorHealth = "off" | "browser" | "ready" | "fail";

type TorState = TorSettings & {
  health: TorHealth;
  load: () => Promise<void>;
  save: (next: Partial<TorSettings>) => Promise<void>;
  check: () => void;
};

export const useTorStore = create<TorState>((set, get) => ({
  ...DEFAULT_TOR,
  health: "off",

  load: async () => {
    const saved = await readKv<TorSettings>(TOR_KEY, DEFAULT_TOR);
    set({ ...saved });
    get().check();
  },

  save: async (next) => {
    const merged = { ...get(), ...next };
    const settings: TorSettings = {
      enabled: merged.enabled,
      socksHost: merged.socksHost,
      socksPort: merged.socksPort,
      onionRelays: merged.onionRelays,
    };
    await writeKv(TOR_KEY, settings);
    set(settings);
    get().check();
  },

  check: () => {
    const { enabled, onionRelays } = get();
    if (!enabled) {
      set({ health: "off" });
      return;
    }
    if (!torAvailableInBrowser()) {
      set({ health: "browser" });
      return;
    }
    set({ health: onionRelays.some(isOnionRelay) ? "ready" : "fail" });
  },
}));
