// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { NDKEvent, NDKSubscription } from "@nostr-dev-kit/ndk";
import { create } from "zustand";
import { KIND_GROUP_ADMINS, KIND_GROUP_LIVEKIT, KIND_GROUP_MEMBERS } from "../../lib/nostr/kinds.ts";
import { getNdk } from "../../lib/nostr/ndk.ts";
import {
  createChannel,
  claimGroupOwner,
  createGroup,
  editGroupMeta,
  fetchChildChannels,
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
import { canModerate, isOwner as pubkeyIsOwner, type GroupAdmin } from "../../lib/nostr/permissions.ts";
import { looksLikeInvite, parseGroupInvite } from "../../lib/nostr/invite.ts";
import { CREATE_RELAY, GROUP_RELAY, normalizeRelayUrl } from "../../lib/nostr/relays.ts";
import { useAuthStore } from "../auth/auth-store.ts";

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
  create: (name: string, relay?: string) => Promise<void>;
  join: (id: string, relay?: string, code?: string) => Promise<void>;
  select: (group: GroupRef) => Promise<void>;
  selectChannel: (channel: Channel) => Promise<void>;
  addChannel: (name: string, kind: ChannelKind) => Promise<void>;
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
const FOUNDED_KEY = "agora.founded";

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

function rememberFounded(key: string): void {
  if (founded.has(key)) return;
  founded.add(key);
  try {
    localStorage.setItem(FOUNDED_KEY, JSON.stringify([...founded]));
  } catch {
    /* quota / private mode */
  }
}

function stopStageWatch(): void {
  stageSub?.stop();
  stageSub = null;
}

function stopRosterWatch(): void {
  rosterSub?.stop();
  rosterSub = null;
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
    if (event.kind === KIND_GROUP_ADMINS) set({ admins: parseGroupAdmins(event) });
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
      set({
        groups: book.groups,
        savedChannels: book.channels,
        busy: false,
        activeKey: book.groups[0] ? groupKey(book.groups[0]) : null,
      });
      if (book.groups[0]) await get().select(book.groups[0]);
    } catch {
      set({ busy: false, error: "group-load-failed" });
    }
  },

  create: async (name, relay = CREATE_RELAY) => {
    set({ busy: true, error: null });
    try {
      const group = await createGroup(name, relay);
      rememberFounded(groupKey(group));
      const me = useAuthStore.getState().pubkey;
      let claimed: GroupAdmin[] = [];
      if (me) {
        claimed = await claimGroupOwner(group, me).catch(() => [{ pubkey: me.toLowerCase(), roles: ["owner"] }]);
      }
      const groups = [...get().groups.filter((item) => groupKey(item) !== groupKey(group)), group];
      await saveGroupList(groups, get().savedChannels);
      set({ groups, busy: false, admins: claimed.length ? claimed : get().admins });
      await get().select(group);
      if (claimed.length) set({ admins: claimed });
    } catch (error) {
      set({ busy: false, error: publishRejectMessage(error) });
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
    set({
      activeKey: groupKey(group),
      activeChannelKey: groupKey(group),
      channels: [asRootChannel(group)],
      members: [],
      admins: [],
      pins: [],
      onStage: [],
    });
    watchStage(group, set);
    watchRoster(group, set);
    try {
      const [meta, members, admins, pins, children, onStage, roleNames] = await Promise.all([
        fetchFullMeta(group.id, group.relay),
        fetchGroupMembers(group.id, group.relay),
        fetchGroupAdmins(group.id, group.relay),
        fetchPins(group.id, group.relay),
        fetchChildChannels(group),
        fetchLivekitParticipants(group.id, group.relay),
        fetchGroupRoles(group.id, group.relay),
      ]);
      const root = asRootChannel(group, meta?.about ?? "", meta?.livekit ?? false);
      if (meta?.name && meta.name !== group.name) {
        root.name = meta.name;
      }
      const localKids = get().savedChannels.filter((item) => item.parent === group.id);
      const seen = new Set(children.map((item) => item.id));
      const channels = [root, ...children, ...localKids.filter((item) => !seen.has(item.id))];
      const groups = get().groups.map((item) =>
        groupKey(item) === groupKey(group) ? { ...item, name: root.name } : item,
      );
      const me = useAuthStore.getState().pubkey?.toLowerCase();
      const nextAdmins =
        me && !admins.some((admin) => admin.pubkey === me) && founded.has(groupKey(group))
          ? [{ pubkey: me, roles: ["owner"] }, ...admins]
          : admins;
      set({
        groups,
        channels,
        members,
        admins: nextAdmins,
        roleNames,
        pins,
        onStage,
        activeChannelKey: groupKey(root),
      });
    } catch {
      set({ members: [], admins: [], pins: [] });
    }
  },

  selectChannel: async (channel) => {
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

  addChannel: async (name, kind) => {
    const group = get().active();
    if (!group) return;
    set({ busy: true, error: null });
    try {
      const channel = await createChannel({ parent: group, name, kind });
      const savedChannels = [
        ...get().savedChannels.filter((item) => groupKey(item) !== groupKey(channel)),
        channel,
      ];
      await saveGroupList(get().groups, savedChannels);
      set({
        savedChannels,
        channels: [...get().channels.filter((item) => groupKey(item) !== groupKey(channel)), channel],
        busy: false,
        error: null,
      });
      await get().selectChannel(channel);
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
      set({ admins });
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
      set({ groups, savedChannels, channels: [], members: [], admins: [], pins: [], onStage: [], activeKey: groups[0] ? groupKey(groups[0]) : null });
      if (groups[0]) await get().select(groups[0]);
    } catch {
      set({ error: "group-leave-failed" });
    }
  },

  unwatchStage: () => {
    stopStageWatch();
    stopRosterWatch();
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
    return canModerate(get().admins, me);
  },

  isOwner: () => {
    const me = useAuthStore.getState().pubkey;
    const admins = get().admins;
    if (pubkeyIsOwner(admins, me)) return true;
    const group = get().active();
    if (me && group && founded.has(groupKey(group))) return true;
    return Boolean(me && admins.length === 0);
  },
}));
