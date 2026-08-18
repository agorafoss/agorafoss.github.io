// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Política ICE — travada.
 *
 * LiveKit e MediaMTX vêem o IP do cliente por desenho: mídia nunca entra no Tor.
 * Aceitamos host candidates (`iceTransportPolicy: "all"`). Não forçamos
 * `"relay"` porque o Ágora não opera um TURN próprio; o SFU já é o relay
 * de mídia. Participantes da sala não trocam mídia P2P — o caminho é o
 * servidor. O que vaza é o IP para o operador do LiveKit/MediaMTX, não
 * o IP de um membro para o outro via host candidate.
 *
 * Sem STUN público (stun.l.google.com). Seria um terceiro a mais sabendo
 * que este IP abriu WebRTC. O servidor de mídia anuncia o ICE dele.
 */
export const ICE_TRANSPORT_POLICY: RTCIceTransportPolicy = "all";

export function mediaIceServers(): RTCIceServer[] {
  return [];
}

export function mediaPeerConfig(): RTCConfiguration {
  return {
    iceServers: mediaIceServers(),
    iceTransportPolicy: ICE_TRANSPORT_POLICY,
  };
}
