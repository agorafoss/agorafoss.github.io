// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export const SEED_NOSTR = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://purplepag.es",
  "wss://relay.nostr.band",
  "wss://nostr.wine",
  "wss://relay.snort.social",
  "wss://eden.nostr.land",
  "wss://nostr.bitcoiner.social",
  "wss://relay.nostr.bg",
  "wss://nostr.mom",
  "wss://relay.nostrplebs.com",
  "wss://nostr.fmt.wiz.biz",
  "wss://relay.nostrich.de",
  "wss://nostr.oxtr.dev",
  "wss://nostr.einundzwanzig.space",
  "wss://relay.mostr.pub",
  "wss://relayable.org",
  "wss://nostr.land",
  "wss://offchain.pub",
  "wss://relay.current.fyi",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.nostr.info",
  "wss://nostr.zebedee.cloud",
  "wss://nostr.sandwich.farm",
  "wss://filter.nostr.wine",
  "wss://relay.orangepill.dev",
  "wss://nostr.fmt.wiz.biz",
  "wss://relay.nostr.wirednet.jp",
  "wss://nostr.lu.ke",
  "wss://groups.0xchat.com",
  "wss://groups.fiatjaf.com",
  "wss://relay.groups.nip29.com",
];

export const SEED_ONION = [
  "ws://oxtrdevav64z64yb7x6rjg4ntzqjhedm5b5zjqulugknhzr46ny2qbad.onion",
  "ws://nostrdarwin.duckdns.org",
];

export type NetworkMap = {
  nostr: string[];
  onion: string[];
};

export async function loadNetworkMap(): Promise<NetworkMap> {
  const nostr = new Set(SEED_NOSTR);
  const onion = new Set(SEED_ONION);
  for (const url of [...nostr]) {
    if (url.includes(".onion")) {
      onion.add(url);
      nostr.delete(url);
    }
  }
  return { nostr: [...nostr], onion: [...onion] };
}
