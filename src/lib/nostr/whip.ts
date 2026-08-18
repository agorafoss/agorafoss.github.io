// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { mediaPeerConfig } from "./ice.ts";

export const DEFAULT_WHIP = "http://localhost:8889/live/agora/whip";
export const DEFAULT_WHEP = "http://localhost:8889/live/agora/whep";

export type WhipSession = {
  pc: RTCPeerConnection;
  location: string;
};

export async function startWhip(whipUrl: string, stream: MediaStream): Promise<WhipSession> {
  const pc = new RTCPeerConnection(mediaPeerConfig());
  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream);
  }
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIce(pc);
  const response = await fetch(whipUrl, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: pc.localDescription?.sdp ?? offer.sdp,
  });
  if (!response.ok) {
    pc.close();
    throw new Error("whip-publish-failed");
  }
  const answer = await response.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answer });
  return { pc, location: response.headers.get("Location") ?? whipUrl };
}

export async function startWhep(whepUrl: string, remote: HTMLVideoElement): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection(mediaPeerConfig());
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });
  pc.ontrack = (event) => {
    remote.srcObject = event.streams[0] ?? new MediaStream([event.track]);
  };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIce(pc);
  const response = await fetch(whepUrl, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: pc.localDescription?.sdp ?? offer.sdp,
  });
  if (!response.ok) {
    pc.close();
    throw new Error("whep-watch-failed");
  }
  const answer = await response.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answer });
  return pc;
}

export async function stopWhip(session: WhipSession): Promise<void> {
  session.pc.getSenders().forEach((sender) => sender.track?.stop());
  session.pc.close();
  if (session.location) {
    await fetch(session.location, { method: "DELETE" }).catch(() => undefined);
  }
}

function waitForIce(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, 2000);
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") {
        window.clearTimeout(timer);
        resolve();
      }
    };
  });
}
