// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import {
  channelIndexD,
  channelKindFromMeta,
  channelsForSquare,
  groupKey,
  parseStoredChannel,
  previousRefs,
  pubkeyFromParticipant,
  publishRejectMessage,
} from "./nip29.ts";

describe("nip29 helpers", () => {
  it("builds previous refs from the last events", () => {
    expect(previousRefs(["aaaaaaaa", "bbbbbbbb", "cccccccc", "dddddddd"], 3)).toEqual([
      "bbbbbbbb",
      "cccccccc",
      "dddddddd",
    ]);
    expect(previousRefs(["0123456789abcdef"], 3)).toEqual(["01234567"]);
  });

  it("keys a group by relay and id", () => {
    expect(groupKey({ relay: "wss://groups.fiatjaf.com", id: "abc" })).toBe(
      "wss://groups.fiatjaf.com#abc",
    );
  });

  it("indexes Ágora channels when the relay has no NIP-29 subgroups", () => {
    expect(channelIndexD("sala")).toBe("agora-channels:sala");
    const palco = parseStoredChannel([
      "ch",
      "sala",
      "palco1",
      "wss://groups.0xchat.com",
      "palco",
      "voice",
      "",
    ]);
    expect(palco?.kind).toBe("voice");
    expect(palco?.parent).toBe("sala");
    expect(channelsForSquare([palco ? ["ch", "sala", "palco1", palco.relay, "palco", "voice", ""] : []], "sala")).toHaveLength(
      1,
    );
    expect(channelsForSquare([["ch", "outra", "x", palco?.relay ?? "", "x", "voice", ""]], "sala")).toHaveLength(0);
  });

  it("marks a channel as voice from agora-stage or empty supported kinds", () => {
    expect(channelKindFromMeta({ livekit: false, stage: false, supportedKinds: null })).toBe("text");
    expect(channelKindFromMeta({ livekit: true, stage: false, supportedKinds: null })).toBe("text");
    expect(channelKindFromMeta({ livekit: false, stage: true, supportedKinds: null })).toBe("voice");
    expect(channelKindFromMeta({ livekit: false, stage: false, supportedKinds: [] })).toBe("voice");
    expect(channelKindFromMeta({ livekit: true, stage: false, supportedKinds: [9] })).toBe("text");
  });

  it("takes the first 64 hex chars of a LiveKit participant identity", () => {
    const pub = "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899";
    expect(pubkeyFromParticipant(`${pub}-session9`)).toBe(pub);
    expect(pubkeyFromParticipant("not-a-key")).toBeNull();
  });

  it("pulls the relay OK reason out of an NDK publish error", () => {
    const error = new Error("Not enough relays received the event");
    (error as Error & { errors: Map<string, Error> }).errors = new Map([
      ["wss://groups.fiatjaf.com", new Error("blocked: to create groups open https://groups.fiatjaf.com")],
    ]);
    expect(publishRejectMessage(error)).toContain("groups.fiatjaf.com");
  });
});
