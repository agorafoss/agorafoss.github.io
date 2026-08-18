import { NDKEvent } from "@nostr-dev-kit/ndk";
import { wrapManyEvents, unwrapEvent } from "nostr-tools/nip17";
import type { Event as NostrEvent } from "nostr-tools";
import { KIND_GIFT_WRAP } from "./kinds.ts";
import { getNdk } from "./ndk.ts";
import type { Identity } from "./types.ts";

export type DirectMessage = {
  id: string;
  wrapId: string;
  pubkey: string;
  peer: string;
  content: string;
  createdAt: number;
  outgoing: boolean;
};

export function unwrapGift(wrap: NostrEvent, secretKey: Uint8Array, me: string): DirectMessage | null {
  try {
    const rumor = unwrapEvent(wrap, secretKey);
    if (!rumor.content) return null;
    const peer = rumor.pubkey === me ? (rumor.tags.find((tag) => tag[0] === "p")?.[1] ?? "") : rumor.pubkey;
    if (!peer) return null;
    return {
      id: rumor.id ?? wrap.id,
      wrapId: wrap.id,
      pubkey: rumor.pubkey,
      peer,
      content: rumor.content,
      createdAt: rumor.created_at ?? wrap.created_at,
      outgoing: rumor.pubkey === me,
    };
  } catch {
    return null;
  }
}

export async function sendDirectMessage(
  identity: Identity,
  peer: string,
  content: string,
): Promise<void> {
  // wrapManyEvents → NIP-59: o wrap (kind 1059) usa created_at com jitter
  // de até 2 dias (randomNow no nostr-tools). O rumor interno fica em `now()`.
  const wraps = wrapManyEvents(
    identity.secretKey,
    [{ publicKey: peer }, { publicKey: identity.pubkey }],
    content,
  );
  const ndk = getNdk();
  for (const wrap of wraps) {
    const event = new NDKEvent(ndk, wrap);
    await event.publish();
  }
}

export function giftWrapFilter(pubkey: string) {
  return { kinds: [KIND_GIFT_WRAP], "#p": [pubkey] };
}
