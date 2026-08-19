// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

type Nip11 = {
  pubkey?: string;
  nip29?: { subgroups?: boolean };
};

const cache = new Map<string, Nip11 | null>();

function relayToHttp(relay: string): string {
  return relay.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:").replace(/\/+$/, "");
}

export async function fetchRelayInfo(relay: string): Promise<Nip11 | null> {
  if (cache.has(relay)) return cache.get(relay) ?? null;
  try {
    const response = await fetch(relayToHttp(relay), {
      headers: { Accept: "application/nostr+json" },
    });
    if (!response.ok) {
      cache.set(relay, null);
      return null;
    }
    const info = (await response.json()) as Nip11;
    cache.set(relay, info);
    return info;
  } catch {
    cache.set(relay, null);
    return null;
  }
}

export async function fetchRelayPubkey(relay: string): Promise<string | null> {
  const info = await fetchRelayInfo(relay);
  const pubkey = info?.pubkey && /^[0-9a-f]{64}$/i.test(info.pubkey) ? info.pubkey.toLowerCase() : null;
  return pubkey;
}

export async function relaySupportsSubgroups(relay: string): Promise<boolean> {
  const info = await fetchRelayInfo(relay);
  return info?.nip29?.subgroups === true;
}
