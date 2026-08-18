import { NDKEvent } from "@nostr-dev-kit/ndk";
import { KIND_MUTE_LIST } from "./kinds.ts";
import { getNdk } from "./ndk.ts";

export type MuteList = {
  pubkeys: string[];
  words: string[];
};

export function emptyMuteList(): MuteList {
  return { pubkeys: [], words: [] };
}

export function parseMuteList(event: NDKEvent): MuteList {
  return {
    pubkeys: [...new Set(event.getMatchingTags("p").map((tag) => tag[1]).filter(Boolean))],
    words: [...new Set(event.getMatchingTags("word").map((tag) => tag[1].toLowerCase()).filter(Boolean))],
  };
}

export function isMuted(list: MuteList, pubkey: string, content = ""): boolean {
  if (list.pubkeys.includes(pubkey)) return true;
  if (!content || list.words.length === 0) return false;
  const lower = content.toLowerCase();
  return list.words.some((word) => lower.includes(word));
}

export function togglePubkey(list: MuteList, pubkey: string): MuteList {
  const has = list.pubkeys.includes(pubkey);
  return {
    ...list,
    pubkeys: has ? list.pubkeys.filter((item) => item !== pubkey) : [...list.pubkeys, pubkey],
  };
}

export function toggleWord(list: MuteList, word: string): MuteList {
  const clean = word.trim().toLowerCase();
  if (!clean) return list;
  const has = list.words.includes(clean);
  return {
    ...list,
    words: has ? list.words.filter((item) => item !== clean) : [...list.words, clean],
  };
}

export async function loadMuteList(pubkey: string): Promise<MuteList> {
  const event = await getNdk().fetchEvent({ kinds: [KIND_MUTE_LIST], authors: [pubkey] });
  return event ? parseMuteList(event) : emptyMuteList();
}

export async function saveMuteList(list: MuteList): Promise<void> {
  const event = new NDKEvent(getNdk());
  event.kind = KIND_MUTE_LIST;
  event.content = "";
  event.tags = [
    ...list.pubkeys.map((pubkey) => ["p", pubkey]),
    ...list.words.map((word) => ["word", word]),
  ];
  await event.publish();
}
