const cache = new Map<string, string | null>();

function relayToHttp(relay: string): string {
  return relay.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:").replace(/\/+$/, "");
}

export async function fetchRelayPubkey(relay: string): Promise<string | null> {
  if (cache.has(relay)) return cache.get(relay) ?? null;
  try {
    const response = await fetch(relayToHttp(relay), {
      headers: { Accept: "application/nostr+json" },
    });
    if (!response.ok) {
      cache.set(relay, null);
      return null;
    }
    const info = (await response.json()) as { pubkey?: string };
    const pubkey = info.pubkey && /^[0-9a-f]{64}$/i.test(info.pubkey) ? info.pubkey.toLowerCase() : null;
    cache.set(relay, pubkey);
    return pubkey;
  } catch {
    cache.set(relay, null);
    return null;
  }
}
