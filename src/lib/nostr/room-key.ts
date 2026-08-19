// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NDKEvent } from "@nostr-dev-kit/ndk";
import { decrypt, encrypt, getConversationKey } from "nostr-tools/nip44";
import { KIND_APP_DATA } from "./kinds.ts";
import { getNdk } from "./ndk.ts";
import { groupRelaySet, type GroupRef } from "./nip29.ts";
import type { Identity } from "./types.ts";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const RAW_LEN = 20;

export function generateRoomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RAW_LEN));
  let raw = "";
  for (const byte of bytes) raw += ALPHABET[byte % 32];
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}-${raw.slice(15, 20)}`;
}

export function roomKeyTag(roomId: string, recipient: string): string {
  return `agora-rk:${roomId}:${recipient.toLowerCase()}`;
}

type Envelope = {
  v: 1;
  secret: string;
  room: string;
};

function pack(secret: string, room: string): Envelope {
  return { v: 1, secret, room };
}

function unpack(raw: string): string | null {
  try {
    const data = JSON.parse(raw) as Partial<Envelope>;
    if (data.v !== 1 || typeof data.secret !== "string" || !data.secret.trim()) return null;
    return data.secret.trim();
  } catch {
    return null;
  }
}

export async function publishRoomKeyEnvelopes(
  identity: Identity,
  room: GroupRef,
  secret: string,
  recipients: string[],
): Promise<void> {
  const unique = [...new Set(recipients.map((item) => item.toLowerCase()).filter(Boolean))];
  if (!unique.includes(identity.pubkey.toLowerCase())) unique.push(identity.pubkey.toLowerCase());
  const ndk = getNdk();
  const payload = JSON.stringify(pack(secret, room.id));
  for (const recipient of unique) {
    const event = new NDKEvent(ndk);
    event.kind = KIND_APP_DATA;
    event.content = encrypt(payload, getConversationKey(identity.secretKey, recipient));
    event.tags = [
      ["d", roomKeyTag(room.id, recipient)],
      ["h", room.id],
      ["p", recipient],
    ];
    await event.publish(groupRelaySet(room.relay)).catch(() => undefined);
  }
}

export async function recoverRoomKey(identity: Identity, room: GroupRef): Promise<string | null> {
  const tag = roomKeyTag(room.id, identity.pubkey);
  const event = await getNdk().fetchEvent(
    { kinds: [KIND_APP_DATA], "#d": [tag] },
    undefined,
    groupRelaySet(room.relay),
  );
  if (!event?.content) return null;
  try {
    const plain = decrypt(event.content, getConversationKey(identity.secretKey, event.pubkey));
    return unpack(plain);
  } catch {
    return null;
  }
}
