// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { nip19 } from "nostr-tools";
import { KIND_GROUP_META } from "./kinds.ts";
import { fetchRelayPubkey } from "./nip11.ts";
import { normalizeRelayUrl } from "./relays.ts";
import type { GroupRef } from "./nip29.ts";

export type GroupInvite = {
  id: string;
  relay: string;
  code?: string;
};

const ZERO_PUBKEY = "0".repeat(64);

export function looksLikeInvite(raw: string): boolean {
  const body = stripScheme(raw.trim().split("?")[0] ?? "");
  return body.startsWith("naddr1") || /\s@\s/.test(raw) || raw.includes(" @ ");
}

function stripScheme(value: string): string {
  return value.replace(/^(nostr:|agora:)/i, "");
}

function splitQuery(raw: string): { body: string; invite?: string } {
  const trimmed = raw.trim();
  const cut = trimmed.indexOf("?");
  if (cut < 0) return { body: stripScheme(trimmed) };
  const params = new URLSearchParams(trimmed.slice(cut + 1));
  return {
    body: stripScheme(trimmed.slice(0, cut)),
    invite: params.get("invite") ?? undefined,
  };
}

export function parseGroupInvite(raw: string): GroupInvite {
  const { body, invite } = splitQuery(raw);
  if (body.startsWith("naddr1")) {
    const decoded = nip19.decode(body);
    if (decoded.type !== "naddr") throw new Error("bad-invite");
    const relay = decoded.data.relays?.[0];
    if (!relay || decoded.data.kind !== KIND_GROUP_META) throw new Error("bad-invite");
    return {
      id: decoded.data.identifier,
      relay: normalizeRelayUrl(relay),
      code: invite,
    };
  }
  const at = body.match(/^(\S+)\s*@\s*(\S+)$/);
  if (at) {
    return { id: at[1], relay: normalizeRelayUrl(at[2]), code: invite };
  }
  throw new Error("bad-invite");
}

export async function encodeGroupInvite(group: GroupRef, code?: string): Promise<string> {
  const pubkey = (await fetchRelayPubkey(group.relay)) ?? ZERO_PUBKEY;
  const naddr = nip19.naddrEncode({
    identifier: group.id,
    pubkey,
    kind: KIND_GROUP_META,
    relays: [group.relay],
  });
  return code?.trim() ? `${naddr}?invite=${encodeURIComponent(code.trim())}` : naddr;
}

export function readInviteFromLocation(href = window.location.href): string | null {
  try {
    const url = new URL(href);
    const fromQuery = url.searchParams.get("invite") ?? url.searchParams.get("naddr");
    if (fromQuery) return fromQuery;
    const hash = url.hash.replace(/^#/, "");
    if (hash.startsWith("naddr1") || hash.startsWith("nostr:") || hash.startsWith("agora:")) return hash;
  } catch {
    return null;
  }
  return null;
}

const STASH = "agora.invite";

export function stashInvite(raw: string): void {
  try {
    sessionStorage.setItem(STASH, raw);
  } catch {
    /* ignore */
  }
}

export function takeStashedInvite(): string | null {
  try {
    const value = sessionStorage.getItem(STASH);
    if (value) sessionStorage.removeItem(STASH);
    return value;
  } catch {
    return null;
  }
}
