export type GroupAdmin = {
  pubkey: string;
  roles: string[];
};

export function rolesOf(admins: GroupAdmin[], pubkey: string): string[] {
  return admins.find((admin) => admin.pubkey === pubkey)?.roles ?? [];
}

export function isListedAdmin(admins: GroupAdmin[], pubkey: string): boolean {
  return admins.some((admin) => admin.pubkey === pubkey);
}

export function canModerate(admins: GroupAdmin[], pubkey: string | null): boolean {
  if (!pubkey) return false;
  if (admins.length === 0) return true;
  return isListedAdmin(admins, pubkey);
}

export function roleLabel(roles: string[]): "owner" | "mod" | "member" {
  const lower = roles.map((role) => role.toLowerCase());
  if (lower.some((role) => role.includes("owner") || role.includes("admin") || role === "ceo")) {
    return "owner";
  }
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
