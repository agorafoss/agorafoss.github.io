// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from "zustand";
import {
  emptyMuteList,
  loadMuteList,
  saveMuteList,
  togglePubkey,
  toggleWord,
  type MuteList,
} from "../../lib/nostr/mute.ts";
import { useAuthStore } from "../auth/auth-store.ts";

type MuteState = {
  list: MuteList;
  error: string | null;
  load: () => Promise<void>;
  mutePubkey: (pubkey: string) => Promise<void>;
  muteWord: (word: string) => Promise<void>;
};

export const useMuteStore = create<MuteState>((set, get) => ({
  list: emptyMuteList(),
  error: null,

  load: async () => {
    const pubkey = useAuthStore.getState().pubkey;
    if (!pubkey) return;
    try {
      set({ list: await loadMuteList(pubkey), error: null });
    } catch {
      set({ error: "mute-load-failed" });
    }
  },

  mutePubkey: async (pubkey) => {
    const list = togglePubkey(get().list, pubkey);
    set({ list });
    try {
      await saveMuteList(list);
    } catch {
      set({ error: "mute-save-failed" });
    }
  },

  muteWord: async (word) => {
    const list = toggleWord(get().list, word);
    set({ list });
    try {
      await saveMuteList(list);
    } catch {
      set({ error: "mute-save-failed" });
    }
  },
}));
