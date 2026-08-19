// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { joinRoom, type Room } from "trystero";
import { create } from "zustand";
import { mediaPeerConfig } from "../../lib/nostr/ice.ts";
import { groupKey, type Channel } from "../../lib/nostr/nip29.ts";
import { exchangeStageHello } from "../../lib/nostr/stage-handshake.ts";
import { watchTalking } from "../../lib/nostr/speak-level.ts";
import { clearStageSecret, readStageSecret, writeStageSecret } from "../../lib/nostr/stage-secret.ts";
import { recoverRoomKey } from "../../lib/nostr/room-key.ts";
import { openClarity, type ClarityHandle } from "../../lib/nostr/voice-clarity.ts";
import { getLiveIdentity } from "../auth/auth-store.ts";
import { useClarityStore } from "./clarity-store.ts";
import {
  applyBitrateCap,
  localMediaConstraints,
  screenConstraints,
  stageIsFull,
  stagePassword,
  stageRoomId,
  stageSignalRelays,
  TRYSTERO_APP_ID,
} from "../../lib/nostr/trystero-room.ts";
import { useRelayStore } from "../relays/relay-store.ts";

type VoiceStatus = "idle" | "locked" | "connecting" | "live" | "error";

export type StagePeer = {
  peerId: string;
  pubkey: string;
  stream: MediaStream | null;
};

type VoiceState = {
  status: VoiceStatus;
  muted: boolean;
  camera: boolean;
  screen: boolean;
  broadcasting: boolean;
  error: string | null;
  channelKey: string | null;
  peers: StagePeer[];
  localVideo: MediaStream | null;
  talking: Record<string, number>;
  full: boolean;
  join: (channel: Channel, password?: string) => Promise<void>;
  leave: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreen: () => Promise<void>;
  startBroadcast: (channel: Channel) => Promise<void>;
  stopBroadcast: () => Promise<void>;
  retuneClarity: () => Promise<void>;
};

let room: Room | null = null;
let micStream: MediaStream | null = null;
let rawMic: MediaStream | null = null;
let clarity: ClarityHandle | null = null;
let cameraStream: MediaStream | null = null;
let screenStream: MediaStream | null = null;
const pubs = new Map<string, string>();
const meters = new Map<string, () => void>();

function dropMeter(id: string): void {
  meters.get(id)?.();
  meters.delete(id);
}

function listenTalking(id: string, stream: MediaStream | null): void {
  dropMeter(id);
  if (!stream) {
    useVoiceStore.setState((state) => ({ talking: { ...state.talking, [id]: 0 } }));
    return;
  }
  const stop = watchTalking(stream, (level) => {
    useVoiceStore.setState((state) => {
      if (id === "self" && state.muted) return { talking: { ...state.talking, self: 0 } };
      return { talking: { ...state.talking, [id]: level } };
    });
  });
  meters.set(id, stop);
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function relayUrls(): string[] {
  return stageSignalRelays(useRelayStore.getState().urls);
}

async function grabMic(): Promise<boolean> {
  if (rawMic) return true;
  if (!room) return false;
  const prefs = useClarityStore.getState();
  try {
    rawMic = await navigator.mediaDevices.getUserMedia(localMediaConstraints(false, !prefs.enabled));
    rawMic.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    micStream = rawMic;
    if (prefs.enabled) {
      useClarityStore.getState().setStatus("loading");
      try {
        clarity = await openClarity(rawMic, prefs.suppression);
        micStream = clarity.stream;
        useClarityStore.getState().setStatus("ready");
      } catch {
        useClarityStore.getState().setStatus("failed");
        micStream = rawMic;
      }
    } else {
      useClarityStore.getState().setStatus("idle");
    }
    listenTalking("self", micStream);
    void Promise.all(room.addStream(micStream)).then(() => capPeers());
    useVoiceStore.setState({ muted: false, error: null });
    return true;
  } catch {
    useClarityStore.getState().setStatus("idle");
    useVoiceStore.setState({ muted: true, error: "voice-mic-denied" });
    return false;
  }
}

async function capPeers(): Promise<void> {
  if (!room) return;
  await Promise.all(Object.values(room.getPeers()).map((pc) => applyBitrateCap(pc)));
}

function pushPeer(peerId: string, stream: MediaStream | null = null): void {
  const pubkey = pubs.get(peerId) ?? "";
  useVoiceStore.setState((state) => {
    const rest = state.peers.filter((peer) => peer.peerId !== peerId);
    return { peers: [...rest, { peerId, pubkey, stream }] };
  });
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  status: "idle",
  muted: false,
  camera: false,
  screen: false,
  broadcasting: false,
  error: null,
  channelKey: null,
  peers: [],
  localVideo: null,
  talking: {},
  full: false,

  join: async (channel, password) => {
    await get().leave();
    const key = groupKey(channel);
    if (password?.trim()) writeStageSecret(key, password);
    let secret = readStageSecret(key);
    if (channel.locked && !secret) {
      const identity = getLiveIdentity();
      if (identity) {
        secret = await recoverRoomKey(identity, channel);
        if (secret) writeStageSecret(key, secret);
      }
    }
    if (channel.locked && !secret) {
      set({ status: "locked", error: "stage-password", channelKey: key, peers: [], localVideo: null, full: false });
      return;
    }
    set({
      status: "connecting",
      error: null,
      channelKey: key,
      peers: [],
      localVideo: null,
      full: false,
    });
    pubs.clear();
    try {
      const next = joinRoom(
        {
          appId: TRYSTERO_APP_ID,
          password: stagePassword(channel.id, secret),
          relayConfig: { urls: relayUrls() },
          rtcConfig: mediaPeerConfig(),
        },
        stageRoomId(channel.id),
        {
          onPeerHandshake: async (peerId, send, receive, isInitiator) => {
            const pubkey = await exchangeStageHello(send, receive, isInitiator);
            pubs.set(peerId, pubkey);
          },
          onJoinError: () => {
            if (!channel.locked) return;
            clearStageSecret(key);
            set({ status: "locked", error: "stage-bad-password" });
          },
        },
      );
      const others = Object.keys(next.getPeers()).length;
      if (stageIsFull(others + 1)) {
        await next.leave();
        set({ status: "error", error: "stage-full", full: true });
        return;
      }
      room = next;
      next.onPeerJoin = (peerId) => {
        const count = Object.keys(next.getPeers()).length + 1;
        set({ full: stageIsFull(count) });
        pushPeer(peerId);
        if (micStream) void Promise.all(next.addStream(micStream, { target: peerId })).then(() => capPeers());
        if (cameraStream) {
          void Promise.all(next.addStream(cameraStream, { target: peerId, metadata: { kind: "camera" } })).then(() =>
            capPeers(),
          );
        }
        if (screenStream) {
          void Promise.all(next.addStream(screenStream, { target: peerId, metadata: { kind: "screen" } })).then(() =>
            capPeers(),
          );
        }
      };
      next.onPeerLeave = (peerId) => {
        pubs.delete(peerId);
        dropMeter(peerId);
        set((state) => {
          const talking = { ...state.talking };
          delete talking[peerId];
          return {
            peers: state.peers.filter((peer) => peer.peerId !== peerId),
            talking,
            full: stageIsFull(Object.keys(next.getPeers()).length + 1),
          };
        });
      };
      next.onPeerStream = (stream, peerId) => {
        pushPeer(peerId, stream);
        listenTalking(peerId, stream);
      };
      set({ status: "live", muted: true, full: stageIsFull(Object.keys(next.getPeers()).length + 1) });
      await grabMic();
    } catch {
      if (room) {
        await room.leave().catch(() => undefined);
        room = null;
      }
      stopStream(micStream);
      stopStream(rawMic);
      micStream = null;
      rawMic = null;
      set({ status: "error", error: "voice-connect-failed" });
    }
  },

  leave: async () => {
    if (room) {
      await room.leave();
      room = null;
    }
    stopStream(micStream);
    stopStream(rawMic);
    stopStream(cameraStream);
    stopStream(screenStream);
    clarity?.destroy();
    micStream = null;
    rawMic = null;
    clarity = null;
    cameraStream = null;
    screenStream = null;
    pubs.clear();
    for (const stop of meters.values()) stop();
    meters.clear();
    set({
      status: "idle",
      camera: false,
      screen: false,
      muted: false,
      broadcasting: false,
      channelKey: null,
      error: null,
      peers: [],
      localVideo: null,
      talking: {},
      full: false,
    });
  },

  toggleMute: async () => {
    if (!rawMic) {
      await grabMic();
      return;
    }
    const muted = !get().muted;
    micStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
    set({ muted, talking: { ...get().talking, self: muted ? 0 : get().talking.self ?? 0 } });
  },

  toggleCamera: async () => {
    if (!room) return;
    if (get().camera) {
      if (cameraStream) {
        room.removeStream(cameraStream);
        stopStream(cameraStream);
        cameraStream = null;
      }
      set({ camera: false, broadcasting: false, localVideo: screenStream });
      return;
    }
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia(localMediaConstraints(true));
      void Promise.all(room.addStream(cameraStream, { metadata: { kind: "camera" } })).then(() => capPeers());
      set({ camera: true, localVideo: cameraStream });
    } catch {
      set({ error: "voice-camera-failed" });
    }
  },

  toggleScreen: async () => {
    if (!room) return;
    if (get().screen) {
      if (screenStream) {
        room.removeStream(screenStream);
        stopStream(screenStream);
        screenStream = null;
      }
      set({ screen: false, localVideo: cameraStream });
      return;
    }
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia(screenConstraints());
      screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (screenStream && room) room.removeStream(screenStream);
        stopStream(screenStream);
        screenStream = null;
        set({ screen: false, localVideo: cameraStream });
      });
      void Promise.all(room.addStream(screenStream, { metadata: { kind: "screen" } })).then(() => capPeers());
      set({ screen: true, localVideo: screenStream });
    } catch {
      set({ error: "voice-screen-failed" });
    }
  },

  startBroadcast: async (channel) => {
    if (get().status !== "live" || get().channelKey !== `${channel.relay}#${channel.id}`) {
      await get().join(channel);
    }
    if (get().status !== "live") return;
    if (!get().camera) await get().toggleCamera();
    if (get().camera) set({ broadcasting: true });
  },

  stopBroadcast: async () => {
    if (get().camera) await get().toggleCamera();
    set({ broadcasting: false });
  },

  retuneClarity: async () => {
    if (!room || !rawMic) return;
    const prefs = useClarityStore.getState();
    if (prefs.enabled) {
      if (clarity) {
        clarity.setEnabled(true);
        clarity.setSuppression(prefs.suppression);
        useClarityStore.getState().setStatus("ready");
        return;
      }
      if (useClarityStore.getState().status === "loading") return;
      useClarityStore.getState().setStatus("loading");
      try {
        const previous = micStream;
        clarity = await openClarity(rawMic, prefs.suppression);
        micStream = clarity.stream;
        if (previous && previous !== micStream) room.removeStream(previous);
        void Promise.all(room.addStream(micStream)).then(() => capPeers());
        micStream.getAudioTracks().forEach((track) => {
          track.enabled = !get().muted;
        });
        listenTalking("self", micStream);
        useClarityStore.getState().setStatus("ready");
      } catch {
        useClarityStore.getState().setStatus("failed");
      }
      return;
    }
    if (clarity) {
      if (micStream) room.removeStream(micStream);
      clarity.destroy();
      clarity = null;
      micStream = rawMic;
      micStream.getAudioTracks().forEach((track) => {
        track.enabled = !get().muted;
      });
      void Promise.all(room.addStream(micStream)).then(() => capPeers());
      listenTalking("self", micStream);
    }
    useClarityStore.getState().setStatus("idle");
  },
}));
