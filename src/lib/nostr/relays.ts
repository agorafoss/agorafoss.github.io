export const GROUP_RELAY = "wss://groups.fiatjaf.com";

export const CREATE_RELAY = "wss://groups.0xchat.com";

export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://purplepag.es",
  GROUP_RELAY,
  CREATE_RELAY,
];

export function relayCreatesGroupsOnWeb(relay: string): boolean {
  try {
    return normalizeRelayUrl(relay) === GROUP_RELAY;
  } catch {
    return false;
  }
}

export function normalizeRelayUrl(input: string): string {
  const trimmed = input.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("invalid-relay-url");
  }
  if (url.protocol !== "wss:" && url.protocol !== "ws:") {
    throw new Error("invalid-relay-url");
  }
  if (!url.hostname) {
    throw new Error("invalid-relay-url");
  }
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return `${url.protocol}//${url.host}${path}`;
}
