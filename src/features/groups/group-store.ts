// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { NDKEvent, NDKSubscription } from "@nostr-dev-kit/ndk";
import { create } from "zustand";
import { KIND_APP_DATA, KIND_GROUP_ADMINS, KIND_GROUP_LIVEKIT, KIND_GROUP_MEMBERS } from "../../lib/nostr/kinds.ts";
import { getNdk } from "../../lib/nostr/ndk.ts";
import {
  createChannel,
  deleteGroup,
  claimGroupOwner,
  createGroup,
  editGroupMeta,
  fetchSquareChannels,
  fetchSquareOwner,
  channelIndexD,
  isDeletableChannel,
  parseStoredChannel,
  publishSquareChannels,
  fetchFullMeta,
  fetchGroupAdmins,
  fetchGroupMembers,
  fetchGroupRoles,
  fetchLivekitParticipants,
  fetchPins,
  groupKey,
  groupRelaySet,
  joinGroup,
  leaveGroup,
  loadGroupList,
  parseGroupAdmins,
  parseGroupMembers,
  parseLivekitParticipants,
  putUser,
  publishRejectMessage,
  removeUser,
  saveGroupList,
  updatePins,
  type Channel,
  type ChannelKind,
  type GroupRef,
} from "../../lib/nostr/nip29.ts";
import { canModerate, isOwner as pubkeyIsOwner, pinOwner, type GroupAdmin } from "../../lib/nostr/permissions.ts";
import { looksLikeInvite, parseGroupInvite } from "../../lib/nostr/invite.ts";
import { CREATE_RELAY, GROUP_RELAY, normalizeRelayUrl } from "../../lib/nostr/relays.ts";
import { generateRoomSecret, publishRoomKeyEnvelopes } from "../../lib/nostr/room-key.ts";
import { writeStageSecret } from "../../lib/nostr/stage-secret.ts";
import { getLiveIdentity, useAuthStore } from "../auth/auth-store.ts";

type GroupState = {
  groups: GroupRef[];
  savedChannels: Channel[];
  activeKey: string | null;
  channels: Channel[];
  activeChannelKey: string | null;
  members: string[];
  admins: GroupAdmin[];
  roleNames: string[];
  pins: string[];
  onStage: string[];
  busy: boolean;
  error: string | null;
  load: () => Promise<void>;
  create: (name: string, relay?: string, locked?: boolean) => Promise<string | null>;
  join: (id: string, relay?: string, code?: string) => Promise<void>;
  select: (group: GroupRef) => Promise<void>;
  selectChannel: (channel: Channel) => Promise<void>;
  addChannel: (name: string, kind: ChannelKind, locked?: boolean) => Promise<string | null>;
  removeChannel: (channel: Channel) => Promise<void>;
  kick: (pubkey: string) => Promise<void>;
  editMeta: (name: string, about: string) => Promise<void>;
  setRole: (pubkey: string, role: string) => Promise<void>;
  pin: (eventId: string) => Promise<void>;
  unpin: (eventId: string) => Promise<void>;
  leave: () => Promise<void>;
  unwatchStage: () => void;
  active: () => GroupRef | null;
  activeChannel: () => Channel | null;
  canModerate: () => boolean;
  isOwner: () => boolean;
};

function asRootChannel(group: GroupRef, about = "", livekit = false): Channel {
  return { ...group, kind: "text", about, livekit };
}

let stageSub: NDKSubscription | null = null;
let rosterSub: NDKSubscription | null = null;
let channelSub: NDKSubscription | null = null;
const FOUNDED_KEY = "agora.founded";
const LAST_SQUARE_KEY = "agora.last-square";
const LAST_CHANNEL_KEY = "agora.last-channel";
const CHANNEL_CACHE_KEY = "agora.channel-cache";

function readLastSquare(): string | null {
  try {
    return localStorage.getItem(LAST_SQUARE_KEY);
  } catch {
    return null;
  }
}

function writeLastSquare(key: string): void {
  try {
    localStorage.setItem(LAST_SQUARE_KEY, key);
  } catch {
    /* quota */
  }
}

function readLastChannels(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LAST_CHANNEL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

function writeLastChannel(squareKey: string, channelKey: string): void {
  try {
    localStorage.setItem(LAST_CHANNEL_KEY, JSON.stringify({ ...readLastChannels(), [squareKey]: channelKey }));
  } catch {
    /* quota */
  }
}

function readChannelCache(): Record<string, Channel[]> {
  try {
    const raw = localStorage.getItem(CHANNEL_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, Channel[]>;
  } catch {
    return {};
  }
}

function writeChannelCache(squareKey: string, channels: Channel[]): void {
  try {
    const kids = channels.filter((item) => item.parent);
    localStorage.setItem(CHANNEL_CACHE_KEY, JSON.stringify({ ...readChannelCache(), [squareKey]: kids }));
  } catch {
    /* quota */
  }
}

function kidsOf(groupId: string, saved: Channel[]): Channel[] {
  const fromList = saved.filter((item) => item.parent === groupId);
  const fromCache = Object.values(readChannelCache())
    .flat()
    .filter((item) => item.parent === groupId);
  const seen = new Set(fromList.map((item) => item.id));
  return [...fromList, ...fromCache.filter((item) => !seen.has(item.id))];
}

function pickChannel(square: GroupRef, channels: Channel[]): Channel {
  const root = channels.find((item) => !item.parent) ?? channels[0];
  const last = readLastChannels()[groupKey(square)];
  return channels.find((item) => groupKey(item) === last) ?? channels.find((item) => item.kind === "voice") ?? root;
}

function readFounded(): Set<string> {
  try {
    const raw = localStorage.getItem(FOUNDED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter((item): item is string => typeof item === "string")) : new Set();
  } catch {
    return new Set();
  }
}

const founded = readFounded();

function persistFounded(): void {
  try {
    localStorage.setItem(FOUNDED_KEY, JSON.stringify([...founded]));
  } catch {
    /* quota / private mode */
  }
}

function rememberFounded(group: Pick<GroupRef, "id" | "relay">): void {
  const keys = [group.id, groupKey(group)];
  try {
    keys.push(groupKey({ id: group.id, relay: normalizeRelayUrl(group.relay) }));
  } catch {
    /* invalid relay stays as the raw key */
  }
  let changed = false;
  for (const key of keys) {
    if (founded.has(key)) continue;
    founded.add(key);
    changed = true;
  }
  if (changed) persistFounded();
}

function isFounded(group: Pick<GroupRef, "id" | "relay">): boolean {
  if (founded.has(group.id) || founded.has(groupKey(group))) return true;
  try {
    if (founded.has(groupKey({ id: group.id, relay: normalizeRelayUrl(group.relay) }))) return true;
  } catch {
    /* ignore */
  }
  const suffix = `#${group.id}`;
  for (const key of founded) {
    if (key === group.id || key.endsWith(suffix)) return true;
  }
  return false;
}

function ownerOf(group: GroupRef | null | undefined): string | undefined {
  if (!group) return undefined;
  if (group.owner) return group.owner.toLowerCase();
  const me = useAuthStore.getState().pubkey?.toLowerCase();
  if (me && isFounded(group)) return me;
  return undefined;
}

function stopStageWatch(): void {
  stageSub?.stop();
  stageSub = null;
}

function stopRosterWatch(): void {
  rosterSub?.stop();
  rosterSub = null;
}

function stopChannelWatch(): void {
  channelSub?.stop();
  channelSub = null;
}

function ingestIndexedChannel(channel: Channel | null, square: GroupRef): void {
  if (!channel || channel.parent !== square.id) return;
  const state = useGroupStore.getState();
  if (state.channels.some((item) => groupKey(item) === groupKey(channel))) return;
  const channels = [...state.channels, channel];
  const savedChannels = [...state.savedChannels.filter((item) => groupKey(item) !== groupKey(channel)), channel];
  writeChannelCache(groupKey(square), channels);
  useGroupStore.setState({ channels, savedChannels });
}

function watchChannels(group: GroupRef): void {
  stopChannelWatch();
  const ndk = getNdk();
  const sub = ndk.subscribe(
    { kinds: [KIND_APP_DATA], "#d": [channelIndexD(group.id)] },
    { closeOnEose: false },
  );
  channelSub = sub;
  sub.on("event", (event: NDKEvent) => {
    for (const tag of event.tags) {
      ingestIndexedChannel(parseStoredChannel(tag), group);
    }
  });
}

function watchRoster(
  group: Pick<GroupRef, "id" | "relay">,
  set: (partial: { admins?: GroupAdmin[]; members?: string[] }) => void,
): void {
  stopRosterWatch();
  const sub = getNdk().subscribe(
    { kinds: [KIND_GROUP_ADMINS, KIND_GROUP_MEMBERS], "#d": [group.id] },
    { closeOnEose: false, relaySet: groupRelaySet(group.relay) },
  );
  rosterSub = sub;
  sub.on("event", (event: NDKEvent) => {
    if (event.kind === KIND_GROUP_ADMINS) {
      const live = useGroupStore.getState().active();
      const owner = ownerOf(live && live.id === group.id ? live : { id: group.id, relay: group.relay, name: "" });
      set({ admins: pinOwner(parseGroupAdmins(event), owner) });
    }
    if (event.kind === KIND_GROUP_MEMBERS) set({ members: parseGroupMembers(event) });
  });
}

function watchStage(group: Pick<GroupRef, "id" | "relay">, set: (partial: { onStage: string[] }) => void): void {
  stopStageWatch();
  const sub = getNdk().subscribe(
    { kinds: [KIND_GROUP_LIVEKIT], "#d": [group.id] },
    { closeOnEose: false, relaySet: groupRelaySet(group.relay) },
  );
  stageSub = sub;
  sub.on("event", (event: NDKEvent) => {
    set({ onStage: parseLivekitParticipants(event) });
  });
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  savedChannels: [],
  activeKey: null,
  channels: [],
  activeChannelKey: null,
  members: [],
  admins: [],
  roleNames: ["owner", "admin", "moderator"],
  pins: [],
  onStage: [],
  busy: false,
  error: null,

  load: async () => {
    const pubkey = useAuthStore.getState().pubkey;
    if (!pubkey) return;
    set({ busy: true, error: null });
    try {
      const book = await loadGroupList(pubkey);
      const last = readLastSquare();
      const first = book.groups.find((item) => groupKey(item) === last) ?? book.groups[0];
      set({
        groups: book.groups,
        savedChannels: book.channels,
        busy: false,
        activeKey: first ? groupKey(first) : null,
      });
      if (first) await get().select(first);
    } catch {
      set({ busy: false, error: "group-load-failed" });
    }
  },

  create: async (name, relay = CREATE_RELAY, locked) => {
    set({ busy: true, error: null });
    try {
      const me = useAuthStore.getState().pubkey;
      const created = await createGroup(name, relay);
      const group: GroupRef = { ...created, owner: me?.toLowerCase() };
      rememberFounded(group);
      let claimed: GroupAdmin[] = me ? pinOwner([], me) : [];
      if (me) {
        claimed = pinOwner(
          await claimGroupOwner(group, me).catch(() => [{ pubkey: me.toLowerCase(), roles: ["owner"] }]),
          me,
        );
      }
      const groups = [...get().groups.filter((item) => groupKey(item) !== groupKey(group)), group];
      await saveGroupList(groups, get().savedChannels);
      await publishSquareChannels(group, []).catch(() => undefined);
      set({ groups, busy: false, admins: claimed.length ? claimed : pinOwner(get().admins, me) });
      await get().select(group);
      if (claimed.length) set({ admins: pinOwner(claimed, ownerOf(group)) });
      if (!get().channels.some((item) => item.kind === "voice")) {
        return await get().addChannel("palco", "voice", locked);
      }
      return null;
    } catch (error) {
      set({ busy: false, error: publishRejectMessage(error) });
      return null;
    }
  },

  join: async (id, relay = GROUP_RELAY, code) => {
    set({ busy: true, error: null });
    try {
      const invite = looksLikeInvite(id) ? parseGroupInvite(id) : null;
      const group = await joinGroup(
        invite?.id ?? id.trim(),
        normalizeRelayUrl(invite?.relay ?? relay),
        code?.trim() || invite?.code,
      );
      const groups = [...get().groups.filter((item) => groupKey(item) !== groupKey(group)), group];
      await saveGroupList(groups, get().savedChannels);
      set({ groups, busy: false });
      await get().select(group);
    } catch (error) {
      const message = error instanceof Error && error.message === "bad-invite" ? "bad-invite" : "group-join-failed";
      set({ busy: false, error: message });
    }
  },

  select: async (group) => {
    const squareKey = groupKey(group);
    const rootNow = asRootChannel(group);
    const cachedKids = kidsOf(group.id, get().savedChannels);
    const instant = [rootNow, ...cachedKids];
    const first = pickChannel(group, instant);
    writeLastSquare(squareKey);
    const seededOwner = ownerOf(group);
    set({
      activeKey: squareKey,
      activeChannelKey: groupKey(first),
      channels: instant,
      members: [],
      admins: pinOwner([], seededOwner),
      pins: [],
      onStage: [],
    });
    watchStage(first, set);
    watchRoster(group, set);
    watchChannels(group);
    if (first.parent) void joinGroup(first.id, first.relay).catch(() => undefined);
    try {
      const [meta, members, admins, pins, children, onStage, roleNames, listedOwner] = await Promise.all([
        fetchFullMeta(group.id, group.relay),
        fetchGroupMembers(group.id, group.relay),
        fetchGroupAdmins(group.id, group.relay),
        fetchPins(first.id, first.relay),
        fetchSquareChannels(group),
        fetchLivekitParticipants(first.id, first.relay),
        fetchGroupRoles(group.id, group.relay),
        fetchSquareOwner(group).catch(() => null),
      ]);
      if (get().activeKey !== squareKey) return;
      const discovered = await fetchSquareChannels(group, [
        ...admins.map((admin) => admin.pubkey),
        ...members,
        useAuthStore.getState().pubkey ?? "",
      ]).catch(() => children);
      const kids = discovered.length ? discovered : children;
      const root = asRootChannel(group, meta?.about ?? "", meta?.livekit ?? false);
      if (meta?.name && meta.name !== group.name) {
        root.name = meta.name;
      }
      const localKids = kidsOf(group.id, get().savedChannels);
      const seen = new Set(kids.map((item) => item.id));
      const channels = [root, ...kids, ...localKids.filter((item) => !seen.has(item.id))];
      writeChannelCache(squareKey, channels);
      const owner = listedOwner ?? seededOwner;
      const nextGroup = { ...group, name: root.name, ...(owner ? { owner } : {}) };
      const groups = get().groups.map((item) => (groupKey(item) === squareKey ? { ...item, ...nextGroup } : item));
      const nextAdmins = pinOwner(admins, owner);
      const stillFirst = get().activeChannelKey === groupKey(first);
      const nextActive = stillFirst ? pickChannel(group, channels) : channels.find((item) => groupKey(item) === get().activeChannelKey);
      const savedChannels = [
        ...get().savedChannels.filter((item) => !seen.has(item.id) || item.parent !== group.id),
        ...kids,
      ];
      set({
        groups,
        channels,
        savedChannels,
        members,
        admins: nextAdmins,
        roleNames,
        pins,
        onStage,
        activeChannelKey: nextActive ? groupKey(nextActive) : groupKey(root),
      });
      if (kids.length || owner) void saveGroupList(groups, savedChannels).catch(() => undefined);
      const me = useAuthStore.getState().pubkey;
      if (me && isFounded(group) && !admins.some((admin) => admin.pubkey === me.toLowerCase())) {
        void claimGroupOwner(nextGroup, me)
          .then((claimed) => {
            if (get().activeKey !== squareKey) return;
            set({ admins: pinOwner(claimed, ownerOf(get().active()) ?? me) });
          })
          .catch(() => undefined);
      }
    } catch {
      if (get().activeKey === squareKey) set({ members: [], admins: pinOwner([], ownerOf(group)), pins: [] });
    }
  },

  selectChannel: async (channel) => {
    const square = get().active();
    if (square) writeLastChannel(groupKey(square), groupKey(channel));
    set({ activeChannelKey: groupKey(channel), onStage: [] });
    watchStage(channel, set);
    try {
      const [pins, onStage] = await Promise.all([
        fetchPins(channel.id, channel.relay),
        fetchLivekitParticipants(channel.id, channel.relay),
      ]);
      set({ pins, onStage });
      if (channel.parent) {
        await joinGroup(channel.id, channel.relay).catch(() => undefined);
      }
    } catch {
      set({ pins: [], onStage: [] });
    }
  },

  addChannel: async (name, kind, locked) => {
    const group = get().active();
    if (!group) return null;
    if (!get().canModerate()) {
      set({ error: "channel-mod-only" });
      return null;
    }
    set({ busy: true, error: null });
    try {
      const secret = locked ? generateRoomSecret() : null;
      const channel = await createChannel({ parent: group, name, kind, locked: Boolean(secret) });
      if (secret) {
        writeStageSecret(groupKey(channel), secret);
        const identity = getLiveIdentity();
        const recipients = [...get().members, useAuthStore.getState().pubkey].filter(Boolean) as string[];
        if (identity) {
          await publishRoomKeyEnvelopes(identity, channel, secret, recipients);
        }
      }
      const savedChannels = [
        ...get().savedChannels.filter((item) => groupKey(item) !== groupKey(channel)),
        channel,
      ];
      await saveGroupList(get().groups, savedChannels);
      const channels = [...get().channels.filter((item) => groupKey(item) !== groupKey(channel)), channel];
      set({
        savedChannels,
        channels,
        busy: false,
        error: null,
      });
      writeChannelCache(groupKey(group), channels);
      await publishSquareChannels(group, channels).catch(() => undefined);
      await get().selectChannel(channel);
      return secret;
    } catch (error) {
      set({ busy: false, error: publishRejectMessage(error) });
      return null;
    }
  },

  removeChannel: async (channel) => {
    if (!isDeletableChannel(channel)) return;
    if (!get().canModerate()) {
      set({ error: "channel-mod-only" });
      return;
    }
    set({ busy: true, error: null });
    try {
      await deleteGroup(channel).catch(() => undefined);
      const savedChannels = get().savedChannels.filter((item) => groupKey(item) !== groupKey(channel));
      const channels = get().channels.filter((item) => groupKey(item) !== groupKey(channel));
      await saveGroupList(get().groups, savedChannels);
      const fallback = channels[0] ?? null;
      const square = get().active();
      if (square) {
        writeChannelCache(groupKey(square), channels);
        await publishSquareChannels(square, channels).catch(() => undefined);
      }
      set({ savedChannels, channels, busy: false });
      if (get().activeChannelKey === groupKey(channel) && fallback) {
        await get().selectChannel(fallback);
      }
    } catch (error) {
      set({ busy: false, error: publishRejectMessage(error) });
    }
  },

  kick: async (pubkey) => {
    const channel = get().activeChannel();
    if (!channel) return;
    try {
      await removeUser(channel, pubkey);
      set({ members: get().members.filter((item) => item !== pubkey) });
    } catch {
      set({ error: "group-kick-failed" });
    }
  },

  editMeta: async (name, about) => {
    const group = get().active();
    if (!group) return;
    set({ busy: true, error: null });
    try {
      await editGroupMeta(group, { name, about });
      const next = { ...group, name: name.trim() };
      set({
        busy: false,
        groups: get().groups.map((item) => (groupKey(item) === groupKey(group) ? next : item)),
        channels: get().channels.map((item) =>
          groupKey(item) === groupKey(group) ? { ...item, name: next.name, about } : item,
        ),
      });
    } catch {
      set({ busy: false, error: "group-edit-failed" });
    }
  },

  setRole: async (pubkey, role) => {
    const group = get().active();
    if (!group) return;
    try {
      await putUser(group, pubkey, role.trim() ? [role.trim()] : []);
      const admins = await fetchGroupAdmins(group.id, group.relay);
      set({ admins: pinOwner(admins, ownerOf(group)) });
    } catch {
      set({ error: "group-role-failed" });
    }
  },

  pin: async (eventId) => {
    const channel = get().activeChannel();
    if (!channel) return;
    const pins = [...new Set([...get().pins, eventId])];
    try {
      await updatePins(channel, pins);
      set({ pins });
    } catch {
      set({ error: "group-pin-failed" });
    }
  },

  unpin: async (eventId) => {
    const channel = get().activeChannel();
    if (!channel) return;
    const pins = get().pins.filter((id) => id !== eventId);
    try {
      await updatePins(channel, pins);
      set({ pins });
    } catch {
      set({ error: "group-pin-failed" });
    }
  },

  leave: async () => {
    const group = get().active();
    if (!group) return;
    try {
      await leaveGroup(group);
      const groups = get().groups.filter((item) => groupKey(item) !== groupKey(group));
      const savedChannels = get().savedChannels.filter((item) => item.parent !== group.id);
      await saveGroupList(groups, savedChannels);
      stopStageWatch();
      stopRosterWatch();
      stopChannelWatch();
      set({ groups, savedChannels, channels: [], members: [], admins: [], pins: [], onStage: [], activeKey: groups[0] ? groupKey(groups[0]) : null });
      if (groups[0]) await get().select(groups[0]);
    } catch {
      set({ error: "group-leave-failed" });
    }
  },

  unwatchStage: () => {
    stopStageWatch();
    stopRosterWatch();
    stopChannelWatch();
    set({ onStage: [] });
  },

  active: () => {
    const { groups, activeKey } = get();
    return groups.find((group) => groupKey(group) === activeKey) ?? null;
  },

  activeChannel: () => {
    const { channels, activeChannelKey } = get();
    return channels.find((channel) => groupKey(channel) === activeChannelKey) ?? null;
  },

  canModerate: () => {
    const me = useAuthStore.getState().pubkey;
    if (canModerate(get().admins, me)) return true;
    return get().isOwner();
  },

  isOwner: () => {
    const me = useAuthStore.getState().pubkey;
    const admins = get().admins;
    if (pubkeyIsOwner(admins, me)) return true;
    const group = get().active();
    if (!me || !group) return false;
    if (group.owner && group.owner.toLowerCase() === me.toLowerCase()) return true;
    return isFounded(group);
  },
}));
