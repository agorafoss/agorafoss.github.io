// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from "zustand";
import {
  addRelayToPool,
  hasNdk,
  onRelayChange,
  removeRelayFromPool,
  snapshotRelays,
} from "../../lib/nostr/ndk.ts";
import { DEFAULT_RELAYS, normalizeRelayUrl } from "../../lib/nostr/relays.ts";
import { readKv, writeKv } from "../../lib/storage/keystore.ts";
import type { RelayInfo } from "../../lib/nostr/types.ts";

const RELAYS_KEY = "relays";

type RelayState = {
  urls: string[];
  live: RelayInfo[];
  error: string | null;
  loadSaved: () => Promise<string[]>;
  attach: () => void;
  detach: () => void;
  add: (raw: string) => Promise<void>;
  remove: (url: string) => Promise<void>;
};

let unsubscribe: (() => void) | null = null;

export const useRelayStore = create<RelayState>((set, get) => ({
  urls: DEFAULT_RELAYS,
  live: [],
  error: null,

  loadSaved: async () => {
    const urls = await readKv<string[]>(RELAYS_KEY, DEFAULT_RELAYS);
    set({ urls });
    return urls;
  },

  attach: () => {
    get().detach();
    const refresh = () => set({ live: snapshotRelays() });
    refresh();
    unsubscribe = onRelayChange(refresh);
  },

  detach: () => {
    unsubscribe?.();
    unsubscribe = null;
    set({ live: [] });
  },

  add: async (raw) => {
    try {
      const url = normalizeRelayUrl(raw);
      if (get().urls.includes(url)) {
        set({ error: "relay-exists" });
        return;
      }
      const urls = [...get().urls, url];
      await writeKv(RELAYS_KEY, urls);
      set({ urls, error: null });
      if (hasNdk()) {
        addRelayToPool(url);
        set({ live: snapshotRelays() });
      }
    } catch {
      set({ error: "invalid-relay-url" });
    }
  },

  remove: async (url) => {
    const urls = get().urls.filter((item) => item !== url);
    await writeKv(RELAYS_KEY, urls);
    set({ urls, error: null });
    if (hasNdk()) {
      removeRelayFromPool(url);
      set({ live: snapshotRelays() });
    }
  },
}));
