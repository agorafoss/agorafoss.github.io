import type { Room } from "livekit-client";
import { create } from "zustand";
import { fetchLivekitToken } from "../../lib/nostr/livekit.ts";
import type { Channel } from "../../lib/nostr/nip29.ts";

type VoiceStatus = "idle" | "connecting" | "live" | "error";

type VoiceState = {
  status: VoiceStatus;
  muted: boolean;
  camera: boolean;
  error: string | null;
  channelKey: string | null;
  join: (channel: Channel) => Promise<void>;
  leave: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => Promise<void>;
};

let room: Room | null = null;

export const useVoiceStore = create<VoiceState>((set, get) => ({
  status: "idle",
  muted: false,
  camera: false,
  error: null,
  channelKey: null,

  join: async (channel) => {
    await get().leave();
    if (!channel.livekit) {
      set({ status: "error", error: "voice-no-stage" });
      return;
    }
    set({ status: "connecting", error: null, channelKey: `${channel.relay}#${channel.id}` });
    try {
      const creds = await fetchLivekitToken(channel.relay, channel.id);
      const { Room } = await import("livekit-client");
      // ICE do servidor LiveKit. Sem STUN Google. Host candidates ok — ver ice.ts.
      const next = new Room();
      await next.connect(creds.url, creds.token);
      await next.localParticipant.setMicrophoneEnabled(true);
      room = next;
      set({ status: "live", muted: false });
    } catch {
      room = null;
      set({ status: "error", error: "voice-connect-failed" });
    }
  },

  leave: async () => {
    if (room) {
      await room.disconnect();
      room = null;
    }
    set({ status: "idle", camera: false, muted: false, channelKey: null, error: null });
  },

  toggleMute: () => {
    const muted = !get().muted;
    void room?.localParticipant.setMicrophoneEnabled(!muted);
    set({ muted });
  },

  toggleCamera: async () => {
    const camera = !get().camera;
    try {
      await room?.localParticipant.setCameraEnabled(camera);
      set({ camera });
    } catch {
      set({ error: "voice-camera-failed" });
    }
  },
}));
