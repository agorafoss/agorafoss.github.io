// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Política ICE — palco mesh (Trystero).
 *
 * Os pares se vêem. Host candidates e um STUN que não é Google.
 * Sem TURN neste ciclo: CGNAT/celular pode falhar; a UI fala nisso.
 * Sem stun.l.google.com — um terceiro a menos sabendo que este IP
 * abriu WebRTC.
 */
export const ICE_TRANSPORT_POLICY: RTCIceTransportPolicy = "all";

export const CLOUDFLARE_STUN = "stun:stun.cloudflare.com:3478";

export function mediaIceServers(): RTCIceServer[] {
  return [{ urls: [CLOUDFLARE_STUN] }];
}

export function mediaPeerConfig(): RTCConfiguration {
  return {
    iceServers: mediaIceServers(),
    iceTransportPolicy: ICE_TRANSPORT_POLICY,
  };
}
