import { NDKEvent } from "@nostr-dev-kit/ndk";
import { KIND_BLOSSOM_AUTH, KIND_NIP98 } from "./kinds.ts";
import { getNdk } from "./ndk.ts";

function encodeAuth(event: NDKEvent): string {
  const raw = JSON.stringify(event.rawEvent());
  return `Nostr ${btoa(unescape(encodeURIComponent(raw)))}`;
}

export async function signNip98(url: string, method: string): Promise<string> {
  const ndk = getNdk();
  const event = new NDKEvent(ndk);
  event.kind = KIND_NIP98;
  event.created_at = Math.floor(Date.now() / 1000);
  event.content = "";
  event.tags = [
    ["u", url],
    ["method", method.toUpperCase()],
  ];
  await event.sign();
  return encodeAuth(event);
}

export async function signBlossomAuth(sha256: string, action = "upload"): Promise<string> {
  const ndk = getNdk();
  const event = new NDKEvent(ndk);
  event.kind = KIND_BLOSSOM_AUTH;
  event.created_at = Math.floor(Date.now() / 1000);
  event.content = "agora upload";
  event.tags = [
    ["t", action],
    ["x", sha256],
    ["expiration", String(Math.floor(Date.now() / 1000) + 120)],
  ];
  await event.sign();
  return encodeAuth(event);
}
