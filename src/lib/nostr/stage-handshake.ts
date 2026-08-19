// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NDKEvent } from "@nostr-dev-kit/ndk";
import { verifyEvent, type Event } from "nostr-tools";
import { getNdk } from "./ndk.ts";

export const STAGE_KIND = 28080;
export const STAGE_CONTENT = "agora-stage";

export type StageHello = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
};

export function verifyStageHello(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const event = payload as Partial<Event>;
  if (event.kind !== STAGE_KIND || event.content !== STAGE_CONTENT) return null;
  if (typeof event.pubkey !== "string" || !/^[0-9a-f]{64}$/.test(event.pubkey)) return null;
  if (typeof event.sig !== "string" || !/^[0-9a-f]{128}$/.test(event.sig)) return null;
  try {
    if (!verifyEvent(event as Event)) return null;
  } catch {
    return null;
  }
  return event.pubkey;
}

export async function makeStageHello(): Promise<StageHello> {
  const event = new NDKEvent(getNdk());
  event.kind = STAGE_KIND;
  event.content = STAGE_CONTENT;
  event.created_at = Math.floor(Date.now() / 1000);
  event.tags = [];
  await event.sign();
  const raw = event.rawEvent();
  if (!raw.sig || !raw.id) throw new Error("stage-hello-unsigned");
  return {
    id: raw.id,
    pubkey: raw.pubkey,
    created_at: raw.created_at ?? Math.floor(Date.now() / 1000),
    kind: STAGE_KIND,
    tags: raw.tags,
    content: STAGE_CONTENT,
    sig: raw.sig,
  };
}

export async function exchangeStageHello(
  send: (data: StageHello) => Promise<void>,
  receive: () => Promise<{ data: unknown }>,
  isInitiator: boolean,
): Promise<string> {
  if (isInitiator) {
    await send(await makeStageHello());
    const remote = verifyStageHello((await receive()).data);
    if (!remote) throw new Error("handshake rejected");
    return remote;
  }
  const remote = verifyStageHello((await receive()).data);
  if (!remote) throw new Error("handshake rejected");
  await send(await makeStageHello());
  return remote;
}
