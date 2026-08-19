// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { appendPending, mergeChatEvent, orderHistory, resolvePending } from "./chat-order.ts";

function msg(partial: { id: string; pubkey: string; content: string; createdAt: number; seq?: number }) {
  return { seq: 0, ...partial };
}

describe("chat order", () => {
  it("does not let a later-arriving event jump by clock", () => {
    const first = mergeChatEvent([], msg({ id: "a", pubkey: "alice", content: "oi", createdAt: 100 }), "live");
    const second = mergeChatEvent(
      first,
      msg({ id: "b", pubkey: "bob", content: "eae", createdAt: 108 }),
      "live",
    );
    const mine = mergeChatEvent(
      second,
      msg({ id: "c", pubkey: "alice", content: "blz?", createdAt: 102 }),
      "live",
    );
    expect(mine.map((item) => item.content)).toEqual(["oi", "eae", "blz?"]);
  });

  it("keeps an optimistic send at the tail when the relay echo has a skewed timestamp", () => {
    const seed = mergeChatEvent([], msg({ id: "b", pubkey: "bob", content: "eae", createdAt: 108 }), "live");
    const withDraft = appendPending(seed, {
      id: "pending:1",
      pubkey: "alice",
      content: "blz?",
      createdAt: 102,
    });
    const echoed = mergeChatEvent(
      withDraft,
      msg({ id: "real", pubkey: "alice", content: "blz?", createdAt: 102 }),
      "live",
    );
    expect(echoed.map((item) => item.id)).toEqual(["b", "real"]);
    expect(echoed[1]?.seq).toBe(withDraft[1]?.seq);
  });

  it("keeps a pending send at the tail while history is still sorting", () => {
    const pending = appendPending(
      [msg({ id: "2", pubkey: "b", content: "depois", createdAt: 20 })],
      { id: "pending:1", pubkey: "alice", content: "agora", createdAt: 1 },
    );
    const sorted = orderHistory(pending);
    expect(sorted.map((item) => item.id)).toEqual(["2", "pending:1"]);
    expect(sorted[1]?.pending).toBe(true);
  });

  it("does not move two already-shown messages when a late event has an earlier clock", () => {
    const shown = mergeChatEvent(
      mergeChatEvent([], msg({ id: "aaaa1111", pubkey: "bob", content: "eae", createdAt: 108 }), "live"),
      msg({ id: "bbbb2222", pubkey: "alice", content: "blz?", createdAt: 109 }),
      "live",
    );
    const late = mergeChatEvent(
      shown,
      { ...msg({ id: "cccc3333", pubkey: "bob", content: "perdido", createdAt: 90 }), previous: ["aaaa1111"] },
      "live",
    );
    expect(late.map((item) => item.content)).toEqual(["eae", "perdido", "blz?"]);
  });

  it("places a reply after the message it already saw, even if the clock is behind", () => {
    const theirs = msg({ id: "bbbbbbbbcccc", pubkey: "bob", content: "eae", createdAt: 108 });
    const mine = {
      ...msg({ id: "aaaaaaaa1111", pubkey: "alice", content: "blz?", createdAt: 102 }),
      previous: ["bbbbbbbb"],
    };
    const history = mergeChatEvent(mergeChatEvent([], theirs, "history"), mine, "history");
    expect(history.map((item) => item.content)).toEqual(["eae", "blz?"]);
    const live = mergeChatEvent(mergeChatEvent([], theirs, "live"), mine, "live");
    expect(live.map((item) => item.content)).toEqual(["eae", "blz?"]);
  });

  it("sorts the historical burst by created_at once", () => {
    const mixed = [
      msg({ id: "2", pubkey: "b", content: "depois", createdAt: 20, seq: 0 }),
      msg({ id: "1", pubkey: "a", content: "antes", createdAt: 10, seq: 0 }),
    ];
    expect(orderHistory(mixed).map((item) => item.content)).toEqual(["antes", "depois"]);
  });

  it("promotes a pending id after publish without moving it", () => {
    const list = appendPending([], {
      id: "pending:1",
      pubkey: "alice",
      content: "oi",
      createdAt: 1,
    });
    const next = resolvePending(list, "pending:1", "real-id");
    expect(next[0]?.id).toBe("real-id");
    expect(next[0]?.pending).toBeUndefined();
    expect(next[0]?.seq).toBe(list[0]?.seq);
  });
});
