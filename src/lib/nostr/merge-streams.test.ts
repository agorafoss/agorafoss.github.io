// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";
import { mergeStreams } from "./merge-streams.ts";

beforeAll(() => {
  class FakeMediaStream {
    private tracks: MediaStreamTrack[];
    constructor(tracks: MediaStreamTrack[] = []) {
      this.tracks = [...tracks];
    }
    getTracks() {
      return this.tracks;
    }
    addTrack(track: MediaStreamTrack) {
      this.tracks.push(track);
    }
  }
  globalThis.MediaStream = FakeMediaStream as unknown as typeof MediaStream;
});

function fakeTrack(id: string, kind: "audio" | "video"): MediaStreamTrack {
  return { id, kind } as MediaStreamTrack;
}

function fakeStream(tracks: MediaStreamTrack[]): MediaStream {
  return {
    getTracks: () => tracks,
  } as MediaStream;
}

describe("mergeStreams", () => {
  it("keeps the first stream if nothing incoming", () => {
    const mic = fakeStream([fakeTrack("a", "audio")]);
    expect(mergeStreams(mic, null)).toBe(mic);
    expect(mergeStreams(null, mic)).toBe(mic);
  });

  it("does not drop mic when camera arrives after", () => {
    const mic = fakeStream([fakeTrack("mic", "audio")]);
    const cam = fakeStream([fakeTrack("cam", "video")]);
    const merged = mergeStreams(mic, cam);
    const ids = merged?.getTracks().map((track) => track.id).sort();
    expect(ids).toEqual(["cam", "mic"]);
  });

  it("does not duplicate the same track", () => {
    const t = fakeTrack("mic", "audio");
    const a = fakeStream([t]);
    const b = fakeStream([t]);
    expect(mergeStreams(a, b)?.getTracks()).toHaveLength(1);
  });
});
