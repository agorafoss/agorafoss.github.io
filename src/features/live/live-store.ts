import type { NDKEvent, NDKSubscription } from "@nostr-dev-kit/ndk";
import { create } from "zustand";
import { liveFilter, parseLive, publishLive, type LiveAnnouncement } from "../../lib/nostr/live.ts";
import { getNdk } from "../../lib/nostr/ndk.ts";
import { groupRelaySet, type GroupRef } from "../../lib/nostr/nip29.ts";
import { DEFAULT_WHIP, startWhip, stopWhip, type WhipSession } from "../../lib/nostr/whip.ts";

type LiveState = {
  current: LiveAnnouncement | null;
  publishing: boolean;
  error: string | null;
  whipUrl: string;
  open: (group: GroupRef) => void;
  close: () => void;
  start: (group: GroupRef, title: string) => Promise<void>;
  stop: (group: GroupRef) => Promise<void>;
  setWhipUrl: (url: string) => void;
};

let subscription: NDKSubscription | null = null;
let session: WhipSession | null = null;
let localStream: MediaStream | null = null;

export const useLiveStore = create<LiveState>((set, get) => ({
  current: null,
  publishing: false,
  error: null,
  whipUrl: DEFAULT_WHIP,

  open: (group) => {
    get().close();
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
    set({ current: null, error: null });
  },

  start: async (group, title) => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      session = await startWhip(get().whipUrl, localStream);
      const streaming = get().whipUrl.replace(/\/whip\/?$/, "/whep");
      await publishLive({ group, title: title.trim() || group.name, streaming, status: "live" });
      set({ publishing: true, error: null });
    } catch {
      localStream?.getTracks().forEach((track) => track.stop());
      localStream = null;
      set({ error: "live-start-failed", publishing: false });
    }
  },

  stop: async (group) => {
    if (session) {
      await stopWhip(session);
      session = null;
    }
    localStream?.getTracks().forEach((track) => track.stop());
    localStream = null;
    try {
      const streaming = get().whipUrl.replace(/\/whip\/?$/, "/whep");
      await publishLive({ group, title: group.name, streaming, status: "ended" });
    } catch {
      /* announcement end is best-effort; local capture already stopped */
    }
    set({ publishing: false });
  },

  setWhipUrl: (url) => set({ whipUrl: url.trim() || DEFAULT_WHIP }),
}));
