import type { NDKEvent, NDKSubscription } from "@nostr-dev-kit/ndk";
import { create } from "zustand";
import { KIND_GROUP_LIVEKIT } from "../../lib/nostr/kinds.ts";
import { getNdk } from "../../lib/nostr/ndk.ts";
import {
  createChannel,
  createGroup,
  editGroupMeta,
  fetchChildChannels,
  fetchFullMeta,
  fetchGroupAdmins,
  fetchGroupMembers,
  fetchLivekitParticipants,
  fetchPins,
  groupKey,
  groupRelaySet,
  joinGroup,
  leaveGroup,
  loadGroupList,
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
import { canModerate, type GroupAdmin } from "../../lib/nostr/permissions.ts";
import { looksLikeInvite, parseGroupInvite } from "../../lib/nostr/invite.ts";
import { CREATE_RELAY, GROUP_RELAY, normalizeRelayUrl } from "../../lib/nostr/relays.ts";
import { useAuthStore } from "../auth/auth-store.ts";

type GroupState = {
  groups: GroupRef[];
  activeKey: string | null;
  channels: Channel[];
  activeChannelKey: string | null;
  members: string[];
  admins: GroupAdmin[];
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
  setRole: (pubkey: string, role: "moderator" | "") => Promise<void>;
  pin: (eventId: string) => Promise<void>;
  unpin: (eventId: string) => Promise<void>;
  leave: () => Promise<void>;
  unwatchStage: () => void;
  active: () => GroupRef | null;
  activeChannel: () => Channel | null;
  canModerate: () => boolean;
};

function asRootChannel(group: GroupRef, about = "", livekit = false): Channel {
  return { ...group, kind: "text", about, livekit };
}

let stageSub: NDKSubscription | null = null;

function stopStageWatch(): void {
  stageSub?.stop();
  stageSub = null;
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
  activeKey: null,
  channels: [],
  activeChannelKey: null,
  members: [],
  admins: [],
  pins: [],
  onStage: [],
  busy: false,
  error: null,

  load: async () => {
    const pubkey = useAuthStore.getState().pubkey;
    if (!pubkey) return;
    set({ busy: true, error: null });
    try {
      const groups = await loadGroupList(pubkey);
      set({
        groups,
        busy: false,
        activeKey: groups[0] ? groupKey(groups[0]) : null,
      });
      if (groups[0]) await get().select(groups[0]);
    } catch {
      set({ busy: false, error: "group-load-failed" });
    }
  },

  create: async (name, relay = CREATE_RELAY) => {
    set({ busy: true, error: null });
    try {
      const group = await createGroup(name, relay);
      const groups = [...get().groups.filter((item) => groupKey(item) !== groupKey(group)), group];
      await saveGroupList(groups);
      set({ groups, busy: false });
      await get().select(group);
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
      await saveGroupList(groups);
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
    try {
      const [meta, members, admins, pins, children, onStage] = await Promise.all([
        fetchFullMeta(group.id, group.relay),
        fetchGroupMembers(group.id, group.relay),
        fetchGroupAdmins(group.id, group.relay),
        fetchPins(group.id, group.relay),
        fetchChildChannels(group),
        fetchLivekitParticipants(group.id, group.relay),
      ]);
      const root = asRootChannel(group, meta?.about ?? "", meta?.livekit ?? false);
      if (meta?.name && meta.name !== group.name) {
        root.name = meta.name;
      }
      const channels = [root, ...children];
      const groups = get().groups.map((item) =>
        groupKey(item) === groupKey(group) ? { ...item, name: root.name } : item,
      );
      set({ groups, channels, members, admins, pins, onStage, activeChannelKey: groupKey(root) });
    } catch {
      set({ members: [], admins: [], pins: [] });
    }
  },

  selectChannel: async (channel) => {
    set({ activeChannelKey: groupKey(channel), onStage: [] });
    watchStage(channel, set);
    try {
      const [members, admins, pins, onStage] = await Promise.all([
        fetchGroupMembers(channel.id, channel.relay),
        fetchGroupAdmins(channel.id, channel.relay),
        fetchPins(channel.id, channel.relay),
        fetchLivekitParticipants(channel.id, channel.relay),
      ]);
      set({ members, admins, pins, onStage });
      if (channel.parent) {
        await joinGroup(channel.id, channel.relay).catch(() => undefined);
      }
    } catch {
      set({ members: [], admins: [], pins: [], onStage: [] });
    }
  },

  addChannel: async (name, kind) => {
    const group = get().active();
    if (!group) return;
    set({ busy: true, error: null });
    try {
      const channel = await createChannel({ parent: group, name, kind });
      set({
        channels: [...get().channels.filter((item) => groupKey(item) !== groupKey(channel)), channel],
        busy: false,
      });
      await get().selectChannel(channel);
    } catch {
      set({ busy: false, error: "channel-create-failed" });
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
      await putUser(group, pubkey, role ? [role] : []);
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
      await saveGroupList(groups);
      stopStageWatch();
      set({ groups, channels: [], members: [], admins: [], pins: [], onStage: [], activeKey: groups[0] ? groupKey(groups[0]) : null });
      if (groups[0]) await get().select(groups[0]);
    } catch {
      set({ error: "group-leave-failed" });
    }
  },

  unwatchStage: () => {
    stopStageWatch();
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
}));
