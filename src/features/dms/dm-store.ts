// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { NDKEvent, NDKSubscription } from "@nostr-dev-kit/ndk";
import { create } from "zustand";
import { getLiveIdentity } from "../auth/auth-store.ts";
import { useAuthStore } from "../auth/auth-store.ts";
import { giftWrapFilter, sendDirectMessage, unwrapGift, type DirectMessage } from "../../lib/nostr/nip17.ts";
import { getNdk } from "../../lib/nostr/ndk.ts";
import { isMuted } from "../../lib/nostr/mute.ts";
import { useMuteStore } from "../mute/mute-store.ts";

type DmState = {
  messages: DirectMessage[];
  names: Record<string, string>;
  activePeer: string | null;
  error: string | null;
  open: () => void;
  close: () => void;
  select: (peer: string) => void;
  send: (peer: string, content: string) => Promise<void>;
};

let subscription: NDKSubscription | null = null;

export const useDmStore = create<DmState>((set, get) => ({
  messages: [],
  names: {},
  activePeer: null,
  error: null,

  open: () => {
    get().close();
    const identity = getLiveIdentity();
    const me = useAuthStore.getState().pubkey;
    if (!identity || !me) {
      set({ error: "dm-needs-local-key" });
      return;
    }
    const ndk = getNdk();
    const sub = ndk.subscribe(giftWrapFilter(me), { closeOnEose: false });
    subscription = sub;
    sub.on("event", (event: NDKEvent) => {
      const message = unwrapGift(event.rawEvent(), identity.secretKey, me);
      if (!message) return;
      if (isMuted(useMuteStore.getState().list, message.peer, message.content)) return;
      set((state) => {
        if (state.messages.some((item) => item.wrapId === message.wrapId)) return state;
        return { messages: [...state.messages, message] };
      });
      void ndk
        .getUser({ pubkey: message.peer })
        .fetchProfile()
        .then((profile) => {
          const name = profile?.displayName || profile?.name;
          if (!name) return;
          set((state) => ({ names: { ...state.names, [message.peer]: name } }));
        })
        .catch(() => undefined);
    });
  },

  close: () => {
    subscription?.stop();
    subscription = null;
    set({ error: null });
  },

  select: (peer) => set({ activePeer: peer, error: null }),

  send: async (peer, content) => {
    const identity = getLiveIdentity();
    const text = content.trim();
    if (!identity || !text) {
      set({ error: identity ? null : "dm-needs-local-key" });
      return;
    }
    try {
      await sendDirectMessage(identity, peer, text);
      set({ error: null, activePeer: peer });
    } catch {
      set({ error: "dm-send-failed" });
    }
  },
}));
