// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export type ChatMessage = {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  replyTo?: string;
  previous?: string[];
  seq: number;
  pending?: boolean;
};

function prefix(id: string): string {
  return id.slice(0, 8);
}

function cites(id: string, previous: string[]): boolean {
  const head = prefix(id);
  return previous.some((item) => item === id || item === head || id.startsWith(item));
}

function lastCitedIndex(list: ChatMessage[], previous: string[]): number {
  if (previous.length === 0) return -1;
  let last = -1;
  for (let index = 0; index < list.length; index += 1) {
    if (cites(list[index].id, previous)) last = index;
  }
  return last;
}

function reseq(list: ChatMessage[]): ChatMessage[] {
  return list.map((message, seq) => ({ ...message, seq }));
}

/** A message that names earlier events cannot sit before those events, even if the clock says otherwise. */
export function constrainByPrevious(list: ChatMessage[]): ChatMessage[] {
  const next = [...list];
  for (let pass = 0; pass < next.length; pass += 1) {
    let moved = false;
    for (let index = 0; index < next.length; index += 1) {
      const previous = next[index].previous ?? [];
      const after = lastCitedIndex(next, previous);
      if (after <= index) continue;
      const [item] = next.splice(index, 1);
      next.splice(after, 0, item);
      moved = true;
      break;
    }
    if (!moved) break;
  }
  return next;
}

export function orderHistory(list: ChatMessage[]): ChatMessage[] {
  const pending = list.filter((message) => message.pending);
  const confirmed = list.filter((message) => !message.pending);
  const ordered = constrainByPrevious(
    [...confirmed].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)),
  );
  return reseq([
    ...ordered,
    ...pending,
  ]);
}

function insertLive(messages: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const pending = messages.filter((message) => message.pending);
  const confirmed = messages.filter((message) => !message.pending);
  const after = lastCitedIndex(confirmed, incoming.previous ?? []);
  const insertAt = after >= 0 ? after + 1 : confirmed.length;
  const next = [...confirmed];
  next.splice(insertAt, 0, { ...incoming, pending: undefined });
  return reseq([...next, ...pending]);
}

export function mergeChatEvent(
  messages: ChatMessage[],
  incoming: Omit<ChatMessage, "seq"> & { seq?: number },
  mode: "history" | "live",
): ChatMessage[] {
  if (messages.some((item) => item.id === incoming.id)) return messages;

  const pendingAt = messages.findIndex(
    (item) => item.pending && item.pubkey === incoming.pubkey && item.content === incoming.content,
  );
  if (pendingAt >= 0) {
    const next = [...messages];
    const previous = incoming.previous ?? next[pendingAt].previous;
    next[pendingAt] = {
      ...incoming,
      previous,
      seq: messages[pendingAt].seq,
      pending: undefined,
    };
    return next;
  }

  const row: ChatMessage = { ...incoming, seq: incoming.seq ?? 0 };
  if (mode === "history") return orderHistory([...messages, row]);
  return insertLive(messages, row);
}

export function appendPending(
  messages: ChatMessage[],
  draft: Omit<ChatMessage, "seq" | "pending">,
): ChatMessage[] {
  const seq = messages.reduce((max, item) => Math.max(max, item.seq), -1) + 1;
  return [...messages, { ...draft, seq, pending: true }];
}

export function resolvePending(messages: ChatMessage[], pendingId: string, realId: string): ChatMessage[] {
  return messages.map((item) =>
    item.id === pendingId ? { ...item, id: realId, pending: undefined } : item,
  );
}

export function dropPending(messages: ChatMessage[], pendingId: string): ChatMessage[] {
  return messages.filter((item) => item.id !== pendingId);
}
