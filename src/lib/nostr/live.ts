import { NDKEvent } from "@nostr-dev-kit/ndk";
import { KIND_LIVE } from "./kinds.ts";
import { getNdk } from "./ndk.ts";
import { groupRelaySet, type GroupRef } from "./nip29.ts";

export type LiveAnnouncement = {
  id: string;
  title: string;
  streaming: string;
  status: "live" | "ended";
  starts: number;
  host: string;
};

export function liveIdentifier(groupId: string): string {
  return `agora:${groupId}`;
}

export function parseLive(event: NDKEvent): LiveAnnouncement | null {
  const streaming = event.tagValue("streaming");
  if (!streaming) return null;
  const status = event.tagValue("status") === "ended" ? "ended" : "live";
  return {
    id: event.tagValue("d") ?? event.id,
    title: event.tagValue("title") ?? "",
    streaming,
    status,
    starts: Number(event.tagValue("starts") ?? event.created_at ?? 0),
    host: event.pubkey,
  };
}

export async function publishLive(opts: {
  group: GroupRef;
  title: string;
  streaming: string;
  status?: "live" | "ended";
}): Promise<void> {
  const event = new NDKEvent(getNdk());
  event.kind = KIND_LIVE;
  event.content = "";
  event.tags = [
    ["d", liveIdentifier(opts.group.id)],
    ["h", opts.group.id],
    ["title", opts.title],
    ["streaming", opts.streaming],
    ["starts", String(Math.floor(Date.now() / 1000))],
    ["status", opts.status ?? "live"],
  ];
  await event.publish(groupRelaySet(opts.group.relay));
}

export function liveFilter(groupId: string) {
  return { kinds: [KIND_LIVE], "#h": [groupId] };
}
