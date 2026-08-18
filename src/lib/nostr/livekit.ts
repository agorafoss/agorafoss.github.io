// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { signNip98 } from "./nip98.ts";

export type LivekitCreds = {
  url: string;
  token: string;
};

function relayToHttp(relay: string): string {
  return relay.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:").replace(/\/+$/, "");
}

export async function probeLivekit(relay: string): Promise<boolean> {
  const url = `${relayToHttp(relay)}/.well-known/nip29/livekit`;
  try {
    const response = await fetch(url, { method: "GET" });
    return response.status === 204 || response.ok;
  } catch {
    return false;
  }
}

export async function fetchLivekitToken(relay: string, groupId: string): Promise<LivekitCreds> {
  const endpoint = `${relayToHttp(relay)}/.well-known/nip29/livekit/${encodeURIComponent(groupId)}`;
  const auth = await signNip98(endpoint, "GET");
  const response = await fetch(endpoint, { headers: { Authorization: auth } });
  if (!response.ok) throw new Error("livekit-token-failed");
  const data = (await response.json()) as { url?: string; server?: string; token?: string; jwt?: string };
  const url = data.url || data.server;
  const token = data.token || data.jwt;
  if (!url || !token) throw new Error("livekit-token-failed");
  return { url, token };
}
