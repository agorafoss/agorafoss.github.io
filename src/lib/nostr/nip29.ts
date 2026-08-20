// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NDKEvent, NDKRelaySet } from "@nostr-dev-kit/ndk";
import { getNdk, isRelayConnected } from "./ndk.ts";
import {
  KIND_CHAT,
  KIND_GROUP_ADMINS,
  KIND_GROUP_CREATE,
  KIND_GROUP_DELETE,
  KIND_GROUP_DELETE_EVENT,
  KIND_GROUP_EDIT,
  KIND_GROUP_JOIN,
  KIND_GROUP_LEAVE,
  KIND_APP_DATA,
  KIND_GROUP_LIST,
  KIND_GROUP_LIVEKIT,
  KIND_GROUP_MEMBERS,
  KIND_GROUP_META,
  KIND_GROUP_PINS,
  KIND_GROUP_PINS_EDIT,
  KIND_GROUP_PUT_USER,
  KIND_GROUP_REMOVE_USER,
  KIND_GROUP_ROLES,
  KIND_REACTION,
} from "./kinds.ts";
import type { GroupAdmin } from "./permissions.ts";
import { CREATE_RELAY, GROUP_RELAY, normalizeRelayUrl } from "./relays.ts";

export type ChannelKind = "text" | "voice";

export type GroupRef = {
  id: string;
  relay: string;
  name: string;
};

export type GroupMeta = {
  id: string;
  name: string;
  about: string;
  picture: string;
  parent?: string;
  children: string[];
  livekit: boolean;
  stage: boolean;
  locked: boolean;
  closed: boolean;
  supportedKinds: number[] | null;
};

export type Channel = GroupRef & {
  kind: ChannelKind;
  about: string;
  livekit: boolean;
  locked?: boolean;
  parent?: string;
};

export function groupKey(group: Pick<GroupRef, "id" | "relay">): string {
  return `${group.relay}#${group.id}`;
}

export function newGroupId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Palco padrão da praça. A outra conta procura este id no mesmo relay, sem depender de subgrupo NIP-29. */
export function defaultPalcoId(parentId: string): string {
  return `agora-palco-${parentId}`;
}

export function groupRelaySet(relay = GROUP_RELAY): NDKRelaySet {
  return NDKRelaySet.fromRelayUrls([normalizeRelayUrl(relay)], getNdk());
}

export function previousRefs(eventIds: string[], limit = 3): string[] {
  const unique = [...new Set(eventIds.map((id) => id.slice(0, 8)))];
  return unique.slice(-50).slice(-limit);
}

export function publishRejectMessage(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const bag = (error as { errors?: Map<unknown, Error> }).errors;
    if (bag) {
      for (const item of bag.values()) {
        if (item instanceof Error && item.message.trim()) return item.message.trim();
      }
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return "group-create-failed";
}

export async function createGroup(name: string, relay = CREATE_RELAY, id = newGroupId()): Promise<GroupRef> {
  if (!isRelayConnected(relay)) {
    throw new Error("group-relay-down");
  }
  const ndk = getNdk();
  const relaySet = groupRelaySet(relay);
  const create = new NDKEvent(ndk);
  create.kind = KIND_GROUP_CREATE;
  create.tags = [
    ["h", id],
    ["name", name.trim()],
  ];
  await create.publish(relaySet);

  const edit = new NDKEvent(ndk);
  edit.kind = KIND_GROUP_EDIT;
  edit.tags = [
    ["h", id],
    ["name", name.trim()],
  ];
  await edit.publish(relaySet);

  return { id, relay: normalizeRelayUrl(relay), name: name.trim() };
}

export async function joinGroup(id: string, relay = GROUP_RELAY, code?: string): Promise<GroupRef> {
  const ndk = getNdk();
  const relaySet = groupRelaySet(relay);
  const join = new NDKEvent(ndk);
  join.kind = KIND_GROUP_JOIN;
  join.content = "";
  join.tags = [["h", id]];
  if (code?.trim()) join.tags.push(["code", code.trim()]);
  await join.publish(relaySet);
  const meta = await fetchGroupMeta(id, relay);
  return { id, relay: normalizeRelayUrl(relay), name: meta?.name || id };
}

export function parseGroupMeta(event: NDKEvent): GroupMeta {
  const id = event.tagValue("d") ?? "";
  const supported = event.getMatchingTags("supported_kinds")[0];
  return {
    id,
    name: event.tagValue("name") ?? id,
    about: event.tagValue("about") ?? "",
    picture: event.tagValue("picture") ?? "",
    parent: event.tagValue("parent") || undefined,
    children: event.getMatchingTags("child").map((tag) => tag[1]).filter(Boolean),
    livekit: event.tags.some((tag) => tag[0] === "livekit"),
    stage: event.tags.some((tag) => tag[0] === "agora-stage"),
    locked: event.tags.some((tag) => tag[0] === "agora-locked"),
    closed: event.tags.some((tag) => tag[0] === "closed"),
    supportedKinds: supported
      ? supported.slice(1).map(Number).filter((value) => !Number.isNaN(value))
      : null,
  };
}

export function channelKindFromMeta(
  meta: Pick<GroupMeta, "livekit" | "stage" | "supportedKinds">,
): ChannelKind {
  if (meta.stage) return "voice";
  if (meta.supportedKinds !== null && meta.supportedKinds.length === 0) return "voice";
  if (!meta.livekit) return "text";
  if (meta.supportedKinds === null) return "text";
  return meta.supportedKinds.includes(KIND_CHAT) ? "text" : "voice";
}

export function metaToChannel(meta: GroupMeta, relay: string): Channel {
  return {
    id: meta.id,
    relay: normalizeRelayUrl(relay),
    name: meta.name,
    kind: channelKindFromMeta(meta),
    about: meta.about,
    livekit: meta.livekit,
    locked: meta.locked,
    parent: meta.parent,
  };
}

export async function fetchGroupMeta(
  id: string,
  relay = GROUP_RELAY,
): Promise<{ name: string; about: string } | null> {
  const meta = await fetchFullMeta(id, relay);
  if (!meta) return null;
  return { name: meta.name, about: meta.about };
}

export async function fetchFullMeta(id: string, relay = GROUP_RELAY): Promise<GroupMeta | null> {
  const event = await getNdk().fetchEvent(
    { kinds: [KIND_GROUP_META], "#d": [id] },
    undefined,
    groupRelaySet(relay),
  );
  return event ? parseGroupMeta(event) : null;
}

export async function fetchChildChannels(parent: GroupRef): Promise<Channel[]> {
  const root = await fetchFullMeta(parent.id, parent.relay);
  if (!root || root.children.length === 0) return [];
  const events = await getNdk().fetchEvents(
    { kinds: [KIND_GROUP_META], "#d": root.children },
    undefined,
    groupRelaySet(parent.relay),
  );
  return [...events].map((event) => metaToChannel(parseGroupMeta(event), parent.relay));
}

export async function createChannel(opts: {
  parent: GroupRef;
  name: string;
  kind: ChannelKind;
  locked?: boolean;
}): Promise<Channel> {
  const palco = opts.kind === "voice" && opts.name.trim().toLowerCase() === "palco";
  const created = await createGroup(
    opts.name,
    opts.parent.relay,
    palco ? defaultPalcoId(opts.parent.id) : newGroupId(),
  ).catch(async (error: unknown) => {
    if (palco) {
      const existing = await fetchDefaultPalco(opts.parent);
      if (existing) {
        return { id: existing.id, relay: existing.relay, name: existing.name };
      }
    }
    throw error;
  });
  const relaySet = groupRelaySet(created.relay);

  const edit = new NDKEvent(getNdk());
  edit.kind = KIND_GROUP_EDIT;
  edit.tags = [
    ["h", created.id],
    ["name", created.name],
  ];
  if (opts.kind === "voice") {
    edit.tags.push(["agora-stage"]);
    edit.tags.push(["supported_kinds"]);
  }
  if (opts.locked) edit.tags.push(["agora-locked"]);
  if (edit.tags.length > 2) {
    await edit.publish(relaySet).catch(() => undefined);
  }

  const parentEdit = new NDKEvent(getNdk());
  parentEdit.kind = KIND_GROUP_EDIT;
  parentEdit.tags = [
    ["h", created.id],
    ["parent", opts.parent.id],
  ];
  await parentEdit.publish(relaySet).catch(() => undefined);

  const join = new NDKEvent(getNdk());
  join.kind = KIND_GROUP_JOIN;
  join.content = "";
  join.tags = [["h", created.id]];
  await join.publish(relaySet).catch(() => undefined);

  return {
    id: created.id,
    relay: created.relay,
    name: created.name,
    kind: opts.kind,
    about: "",
    livekit: opts.kind === "voice",
    locked: Boolean(opts.locked),
    parent: opts.parent.id,
  };
}

async function publishModeration(kind: number, group: GroupRef, tags: string[][]): Promise<void> {
  const event = new NDKEvent(getNdk());
  event.kind = kind;
  event.content = "";
  event.tags = [["h", group.id], ...tags];
  await event.publish(groupRelaySet(group.relay));
}

export async function editGroupMeta(
  group: GroupRef,
  draft: { name: string; about?: string },
): Promise<void> {
  const edit = new NDKEvent(getNdk());
  edit.kind = KIND_GROUP_EDIT;
  edit.tags = [
    ["h", group.id],
    ["name", draft.name.trim()],
  ];
  if (draft.about?.trim()) edit.tags.push(["about", draft.about.trim()]);
  await edit.publish(groupRelaySet(group.relay));
}

export async function putUser(group: GroupRef, pubkey: string, roles: string[] = []): Promise<void> {
  await publishModeration(KIND_GROUP_PUT_USER, group, [["p", pubkey, ...roles]]);
}

export async function removeUser(group: GroupRef, pubkey: string): Promise<void> {
  await publishModeration(KIND_GROUP_REMOVE_USER, group, [["p", pubkey]]);
}

export async function deleteEvent(group: GroupRef, eventId: string): Promise<void> {
  await publishModeration(KIND_GROUP_DELETE_EVENT, group, [["e", eventId]]);
}

export async function deleteGroup(group: GroupRef): Promise<void> {
  await publishModeration(KIND_GROUP_DELETE, group, []);
}

export async function leaveGroup(group: GroupRef): Promise<void> {
  await publishModeration(KIND_GROUP_LEAVE, group, []);
}

export async function updatePins(group: GroupRef, eventIds: string[]): Promise<void> {
  await publishModeration(
    KIND_GROUP_PINS_EDIT,
    group,
    eventIds.map((id) => ["e", id]),
  );
}

export function parseGroupAdmins(event: NDKEvent): GroupAdmin[] {
  return event
    .getMatchingTags("p")
    .map((tag) => ({
      pubkey: (tag[1] ?? "").toLowerCase(),
      roles: tag.slice(2).filter(Boolean),
    }))
    .filter((admin) => Boolean(admin.pubkey));
}

export async function fetchGroupAdmins(id: string, relay = GROUP_RELAY): Promise<GroupAdmin[]> {
  const event = await getNdk().fetchEvent(
    { kinds: [KIND_GROUP_ADMINS], "#d": [id] },
    undefined,
    groupRelaySet(relay),
  );
  return event ? parseGroupAdmins(event) : [];
}

export function parseGroupMembers(event: NDKEvent): string[] {
  return event
    .getMatchingTags("p")
    .map((tag) => (tag[1] ?? "").toLowerCase())
    .filter(Boolean);
}

export async function fetchGroupRoles(id: string, relay = GROUP_RELAY): Promise<string[]> {
  const event = await getNdk().fetchEvent(
    { kinds: [KIND_GROUP_ROLES], "#d": [id] },
    undefined,
    groupRelaySet(relay),
  );
  if (!event) return ["owner", "admin", "moderator"];
  const named = event
    .getMatchingTags("role")
    .map((tag) => tag[1])
    .filter(Boolean);
  return named.length ? named : ["owner", "admin", "moderator"];
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function claimGroupOwner(group: GroupRef, pubkey: string): Promise<GroupAdmin[]> {
  await putUser(group, pubkey, ["owner"]);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const admins = await fetchGroupAdmins(group.id, group.relay);
    if (admins.some((admin) => admin.pubkey === pubkey.toLowerCase())) return admins;
    await wait(400);
  }
  return [{ pubkey: pubkey.toLowerCase(), roles: ["owner"] }];
}

export async function fetchPins(id: string, relay = GROUP_RELAY): Promise<string[]> {
  const event = await getNdk().fetchEvent(
    { kinds: [KIND_GROUP_PINS], "#d": [id] },
    undefined,
    groupRelaySet(relay),
  );
  if (!event) return [];
  return event.getMatchingTags("e").map((tag) => tag[1]).filter(Boolean);
}

export function pubkeyFromParticipant(value: string): string | null {
  const pub = value.trim().toLowerCase().slice(0, 64);
  return /^[0-9a-f]{64}$/.test(pub) ? pub : null;
}

export function parseLivekitParticipants(event: NDKEvent): string[] {
  return [
    ...new Set(
      event
        .getMatchingTags("participant")
        .map((tag) => pubkeyFromParticipant(tag[1] ?? ""))
        .filter((pubkey): pubkey is string => Boolean(pubkey)),
    ),
  ];
}

export async function fetchLivekitParticipants(id: string, relay = GROUP_RELAY): Promise<string[]> {
  const event = await getNdk().fetchEvent(
    { kinds: [KIND_GROUP_LIVEKIT], "#d": [id] },
    undefined,
    groupRelaySet(relay),
  );
  return event ? parseLivekitParticipants(event) : [];
}

export async function fetchGroupMembers(id: string, relay = GROUP_RELAY): Promise<string[]> {
  const event = await getNdk().fetchEvent(
    { kinds: [KIND_GROUP_MEMBERS], "#d": [id] },
    undefined,
    groupRelaySet(relay),
  );
  return event ? parseGroupMembers(event) : [];
}

export type GroupBook = {
  groups: GroupRef[];
  channels: Channel[];
};

export function channelIndexD(squareId: string): string {
  return `agora-channels:${squareId}`;
}

export function parseStoredChannel(tag: string[]): Channel | null {
  if (tag[0] !== "ch" || !tag[1] || !tag[2]) return null;
  const kind: ChannelKind = tag[5] === "voice" ? "voice" : "text";
  return {
    id: tag[2],
    relay: tag[3] || GROUP_RELAY,
    name: tag[4] || tag[2],
    kind,
    about: "",
    livekit: kind === "voice",
    locked: tag[6] === "locked",
    parent: tag[1],
  };
}

export async function loadGroupList(pubkey: string): Promise<GroupBook> {
  const event = await getNdk().fetchEvent({ kinds: [KIND_GROUP_LIST], authors: [pubkey] });
  if (!event) return { groups: [], channels: [] };
  const groups = event
    .getMatchingTags("group")
    .map((tag) => ({
      id: tag[1],
      relay: tag[2] || GROUP_RELAY,
      name: tag[3] || tag[1],
    }))
    .filter((group) => Boolean(group.id));
  const channels = event.tags.map(parseStoredChannel).filter((item): item is Channel => Boolean(item));
  return { groups, channels };
}

export function channelsForSquare(tags: string[][], squareId: string): Channel[] {
  return tags
    .map(parseStoredChannel)
    .filter((item): item is Channel => item !== null && item.parent === squareId);
}

function mergeChannels(lists: Channel[][]): Channel[] {
  const merged = new Map<string, Channel>();
  for (const list of lists) {
    for (const channel of list) merged.set(channel.id, channel);
  }
  return [...merged.values()];
}

export async function fetchChannelIndex(group: GroupRef): Promise<Channel[]> {
  const events = await getNdk().fetchEvents({ kinds: [KIND_APP_DATA], "#d": [channelIndexD(group.id)] });
  return mergeChannels([[...events].flatMap((event) => channelsForSquare(event.tags, group.id))]);
}

export async function fetchChannelsFromLists(group: GroupRef, authors: string[]): Promise<Channel[]> {
  const pubkeys = [...new Set(authors.map((item) => item.toLowerCase()).filter(Boolean))];
  if (pubkeys.length === 0) return [];
  const events = await getNdk().fetchEvents({ kinds: [KIND_GROUP_LIST], authors: pubkeys });
  return mergeChannels([[...events].flatMap((event) => channelsForSquare(event.tags, group.id))]);
}

export async function fetchChannelsByRelayHint(group: GroupRef): Promise<Channel[]> {
  const url = normalizeRelayUrl(group.relay);
  const variants = [...new Set([url, `${url}/`])];
  const batches = await Promise.all(
    variants.map((relay) => getNdk().fetchEvents({ kinds: [KIND_GROUP_LIST], "#r": [relay] })),
  );
  return mergeChannels(batches.map((set) => [...set].flatMap((event) => channelsForSquare(event.tags, group.id))));
}

export async function fetchDefaultPalco(group: GroupRef): Promise<Channel | null> {
  const id = defaultPalcoId(group.id);
  const meta = await fetchFullMeta(id, group.relay);
  if (!meta) return null;
  return {
    id,
    relay: normalizeRelayUrl(group.relay),
    name: meta.name || "palco",
    kind: "voice",
    about: meta.about,
    livekit: true,
    locked: meta.locked,
    parent: group.id,
  };
}

export async function fetchSquareChannels(group: GroupRef, extraAuthors: string[] = []): Promise<Channel[]> {
  const [kids, index, fromLists, fromHint, palco] = await Promise.all([
    fetchChildChannels(group),
    fetchChannelIndex(group),
    fetchChannelsFromLists(group, extraAuthors),
    fetchChannelsByRelayHint(group),
    fetchDefaultPalco(group),
  ]);
  return mergeChannels([kids, index, fromLists, fromHint, palco ? [palco] : []]);
}

export async function publishSquareChannels(group: GroupRef, channels: Channel[]): Promise<void> {
  const ndk = getNdk();
  const event = new NDKEvent(ndk);
  event.kind = KIND_APP_DATA;
  event.tags = [
    ["d", channelIndexD(group.id)],
    ["h", group.id],
    ...channels
      .filter((channel) => channel.parent === group.id)
      .map((channel) => [
        "ch",
        channel.parent ?? group.id,
        channel.id,
        channel.relay,
        channel.name,
        channel.kind,
        channel.locked ? "locked" : "",
      ]),
  ];
  await event.publish();
  await event.publish(groupRelaySet(group.relay)).catch(() => undefined);
}

export async function saveGroupList(groups: GroupRef[], channels: Channel[] = []): Promise<void> {
  const ndk = getNdk();
  const event = new NDKEvent(ndk);
  event.kind = KIND_GROUP_LIST;
  const relays = [...new Set([...groups.map((group) => group.relay), ...channels.map((channel) => channel.relay)])];
  event.tags = [
    ...groups.map((group) => ["group", group.id, group.relay, group.name]),
    ...channels
      .filter((channel) => channel.parent)
      .map((channel) => [
        "ch",
        channel.parent ?? "",
        channel.id,
        channel.relay,
        channel.name,
        channel.kind,
        channel.locked ? "locked" : "",
      ]),
    ...relays.map((relay) => ["r", relay]),
  ];
  await event.publish();
}

export async function publishChat(opts: {
  group: GroupRef;
  content: string;
  previous: string[];
  replyTo?: string;
}): Promise<string> {
  const ndk = getNdk();
  const event = new NDKEvent(ndk);
  event.kind = KIND_CHAT;
  event.content = opts.content;
  event.tags = [["h", opts.group.id]];
  if (opts.previous.length > 0) {
    event.tags.push(["previous", ...opts.previous]);
  }
  if (opts.replyTo) {
    event.tags.push(["e", opts.replyTo]);
  }
  await event.publish(groupRelaySet(opts.group.relay));
  return event.id;
}

export async function publishReaction(group: GroupRef, eventId: string, emoji: string): Promise<void> {
  const ndk = getNdk();
  const event = new NDKEvent(ndk);
  event.kind = KIND_REACTION;
  event.content = emoji;
  event.tags = [
    ["h", group.id],
    ["e", eventId],
  ];
  await event.publish(groupRelaySet(group.relay));
}
