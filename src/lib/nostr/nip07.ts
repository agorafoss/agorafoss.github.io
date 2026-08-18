export function hasNip07(): boolean {
  return typeof window !== "undefined" && Boolean(window.nostr?.getPublicKey);
}
