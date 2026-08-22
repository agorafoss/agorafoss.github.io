// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export type GroupAdmin = {
  pubkey: string;
  roles: string[];
};

export function samePubkey(a?: string | null, b?: string | null): boolean {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

export function rolesOf(admins: GroupAdmin[], pubkey: string): string[] {
  return admins.find((admin) => samePubkey(admin.pubkey, pubkey))?.roles ?? [];
}

export function isListedAdmin(admins: GroupAdmin[], pubkey: string): boolean {
  return admins.some((admin) => samePubkey(admin.pubkey, pubkey));
}

function isOwnerRole(roles: string[]): boolean {
  return roles.some((role) => {
    const lower = role.toLowerCase();
    return lower.includes("owner") || lower === "admin" || lower === "ceo";
  });
}

export function rankOf(admins: GroupAdmin[], pubkey: string): "owner" | "mod" | "member" {
  const index = admins.findIndex((admin) => samePubkey(admin.pubkey, pubkey));
  if (index < 0) return "member";
  if (index === 0 || isOwnerRole(admins[index].roles)) return "owner";
  return "mod";
}

export function isOwner(admins: GroupAdmin[], pubkey: string | null): boolean {
  if (!pubkey) return false;
  return rankOf(admins, pubkey) === "owner";
}

export function canModerate(admins: GroupAdmin[], pubkey: string | null): boolean {
  if (!pubkey) return false;
  return isListedAdmin(admins, pubkey);
}

/** Keeps a known founder in the 39001 roster when the relay never publishes it. */
export function pinOwner(admins: GroupAdmin[], ownerPubkey?: string | null): GroupAdmin[] {
  if (!ownerPubkey) return admins;
  const owner = ownerPubkey.toLowerCase();
  const existing = admins.find((admin) => samePubkey(admin.pubkey, owner));
  const others = admins.filter((admin) => !samePubkey(admin.pubkey, owner));
  const roles = existing?.roles.length
    ? isOwnerRole(existing.roles)
      ? existing.roles
      : ["owner", ...existing.roles]
    : ["owner"];
  return [{ pubkey: owner, roles }, ...others];
}

export function roleLabel(roles: string[]): "owner" | "mod" | "member" {
  if (isOwnerRole(roles)) return "owner";
  if (roles.length > 0) return "mod";
  return "member";
}

/** O que um membro já pode sem estar no 39001. O relay é quem manda. */
export const MEMBER_DEFAULTS = [
  "view",
  "speak",
  "react",
  "attach",
  "history",
  "invite",
  "voice",
] as const;

export const MOD_ONLY = ["kick", "delete", "pin", "channel", "edit", "roles"] as const;
