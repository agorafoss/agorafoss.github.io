// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { NDKEvent, NDKSubscription } from "@nostr-dev-kit/ndk";
import { create } from "zustand";
import { KIND_CHAT, KIND_GROUP_DELETE_EVENT, KIND_REACTION } from "../../lib/nostr/kinds.ts";
import { uploadBlob } from "../../lib/nostr/blossom.ts";
import { getNdk } from "../../lib/nostr/ndk.ts";
import {
  deleteEvent,
  groupRelaySet,
  previousRefs,
  publishChat,
  publishReaction,
  type GroupRef,
} from "../../lib/nostr/nip29.ts";
import { isMuted } from "../../lib/nostr/mute.ts";
import { useMuteStore } from "../mute/mute-store.ts";

export type ChatMessage = {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  replyTo?: string;
};

export type ReactionMap = Record<string, Record<string, string[]>>;

type ChatState = {
  messages: ChatMessage[];
  reactions: ReactionMap;
  names: Record<string, string>;
  replyTo: ChatMessage | null;
  error: string | null;
  open: (group: GroupRef) => void;
  close: () => void;
  send: (group: GroupRef, content: string) => Promise<void>;
  attach: (group: GroupRef, file: File) => Promise<void>;
  react: (group: GroupRef, eventId: string, emoji: string) => Promise<void>;
  remove: (group: GroupRef, eventId: string) => Promise<void>;
  setReply: (message: ChatMessage | null) => void;
};

let subscription: NDKSubscription | null = null;
let openKey: string | null = null;

type ChatCache = {
  messages: ChatMessage[];
  reactions: ReactionMap;
  names: Record<string, string>;
};

const cache = new Map<string, ChatCache>();

function channelKey(group: GroupRef): string {
  return `${group.relay}#${group.id}`;
}

function snapshot(): ChatCache {
  const { messages, reactions, names } = useChatStore.getState();
  return { messages, reactions, names };
}

function sortMessages(list: ChatMessage[]): ChatMessage[] {
  return [...list].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

function hidden(pubkey: string, content: string): boolean {
  return isMuted(useMuteStore.getState().list, pubkey, content);
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  reactions: {},
  names: {},
  replyTo: null,
  error: null,

  open: (group) => {
    const key = channelKey(group);
    if (openKey === key && subscription) return;
    if (openKey && openKey !== key) cache.set(openKey, snapshot());
    subscription?.stop();
    subscription = null;
    openKey = key;
    const hit = cache.get(key);
    if (hit) set({ ...hit, replyTo: null, error: null });
    else if (get().messages.length) set({ messages: [], reactions: {}, replyTo: null, error: null });
    const ndk = getNdk();
    const sub = ndk.subscribe(
      { kinds: [KIND_CHAT, KIND_REACTION, KIND_GROUP_DELETE_EVENT], "#h": [group.id] },
      { closeOnEose: false, relaySet: groupRelaySet(group.relay) },
    );
    subscription = sub;
    sub.on("event", (event: NDKEvent) => {
      if (event.kind === KIND_GROUP_DELETE_EVENT) {
        const target = event.tagValue("e");
        if (!target) return;
        set((state) => ({ messages: state.messages.filter((item) => item.id !== target) }));
        return;
      }
      if (event.kind === KIND_REACTION) {
        const target = event.tagValue("e");
        if (!target) return;
        const emoji = event.content || "+";
        set((state) => {
          const forEvent = { ...(state.reactions[target] ?? {}) };
          const people = new Set(forEvent[emoji] ?? []);
          people.add(event.pubkey);
          forEvent[emoji] = [...people];
          return { reactions: { ...state.reactions, [target]: forEvent } };
        });
        return;
      }
      if (event.kind !== KIND_CHAT) return;
      if (hidden(event.pubkey, event.content)) return;
      const message: ChatMessage = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at ?? 0,
        replyTo: event.tagValue("e"),
      };
      set((state) => {
        if (state.messages.some((item) => item.id === message.id)) return state;
        return { messages: sortMessages([...state.messages, message]) };
      });
      void ndk
        .getUser({ pubkey: event.pubkey })
        .fetchProfile()
        .then((profile) => {
          const name = profile?.displayName || profile?.name;
          if (!name) return;
          set((state) => ({ names: { ...state.names, [event.pubkey]: name } }));
        })
        .catch(() => undefined);
    });
  },

  close: () => {
    if (openKey) cache.set(openKey, snapshot());
    subscription?.stop();
    subscription = null;
    openKey = null;
  },

  send: async (group, content) => {
    const text = content.trim();
    if (!text) return;
    try {
      const replyTo = get().replyTo?.id;
      const previous = previousRefs(
        get()
          .messages.filter((message) => message.pubkey !== getNdk().activeUser?.pubkey)
          .map((message) => message.id),
      );
      await publishChat({ group, content: text, previous, replyTo });
      set({ replyTo: null, error: null });
    } catch {
      set({ error: "chat-send-failed" });
    }
  },

  attach: async (group, file) => {
    try {
      const url = await uploadBlob(file);
      await get().send(group, url);
    } catch {
      set({ error: "chat-upload-failed" });
    }
  },

  react: async (group, eventId, emoji) => {
    const me = getNdk().activeUser?.pubkey;
    if (me) {
      set((state) => {
        const forEvent = { ...(state.reactions[eventId] ?? {}) };
        const people = new Set(forEvent[emoji] ?? []);
        people.add(me);
        forEvent[emoji] = [...people];
        return { reactions: { ...state.reactions, [eventId]: forEvent } };
      });
    }
    try {
      await publishReaction(group, eventId, emoji);
    } catch {
      set({ error: "chat-react-failed" });
    }
  },

  remove: async (group, eventId) => {
    try {
      await deleteEvent(group, eventId);
      set((state) => ({ messages: state.messages.filter((item) => item.id !== eventId) }));
    } catch {
      set({ error: "chat-delete-failed" });
    }
  },

  setReply: (message) => set({ replyTo: message }),
}));
