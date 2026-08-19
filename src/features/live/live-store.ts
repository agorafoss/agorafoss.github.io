// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { NDKEvent, NDKSubscription } from "@nostr-dev-kit/ndk";
import { create } from "zustand";
import { liveFilter, parseLive, type LiveAnnouncement } from "../../lib/nostr/live.ts";
import { getNdk } from "../../lib/nostr/ndk.ts";
import { groupKey, groupRelaySet, type Channel, type GroupRef } from "../../lib/nostr/nip29.ts";
import { useGroupStore } from "../groups/group-store.ts";
import { useVoiceStore } from "../voice/voice-store.ts";

type LiveState = {
  current: LiveAnnouncement | null;
  publishing: boolean;
  error: string | null;
  open: (group: GroupRef) => void;
  close: () => void;
  start: (group: GroupRef, title: string) => Promise<void>;
  stop: (group: GroupRef) => Promise<void>;
};

let subscription: NDKSubscription | null = null;
let openKey: string | null = null;

function palcoOf(group: GroupRef): Channel | null {
  if ("kind" in group && (group as Channel).kind === "voice") return group as Channel;
  return useGroupStore.getState().channels.find((channel) => channel.kind === "voice") ?? null;
}

export const useLiveStore = create<LiveState>((set) => ({
  current: null,
  publishing: false,
  error: null,

  open: (group) => {
    const key = groupKey(group);
    if (openKey === key && subscription) return;
    subscription?.stop();
    openKey = key;
    const sub = getNdk().subscribe(liveFilter(group.id), {
      closeOnEose: false,
      relaySet: groupRelaySet(group.relay),
    });
    subscription = sub;
    sub.on("event", (event: NDKEvent) => {
      const live = parseLive(event);
      if (!live) return;
      set({ current: live.status === "ended" ? null : live });
    });
  },

  close: () => {
    subscription?.stop();
    subscription = null;
    openKey = null;
    set({ current: null, error: null, publishing: false });
  },

  start: async (group, title) => {
    const palco = palcoOf(group);
    if (!palco) {
      set({ error: "live-no-stage", publishing: false });
      return;
    }
    await useVoiceStore.getState().startBroadcast(palco);
    if (!useVoiceStore.getState().broadcasting) {
      set({ error: useVoiceStore.getState().error ?? "live-start-failed", publishing: false });
      return;
    }
    set({
      publishing: true,
      error: null,
      current: {
        id: palco.id,
        title: title.trim() || palco.name,
        streaming: "",
        status: "live",
        starts: Math.floor(Date.now() / 1000),
        host: "",
      },
    });
  },

  stop: async () => {
    await useVoiceStore.getState().stopBroadcast();
    set({ publishing: false });
  },
}));
