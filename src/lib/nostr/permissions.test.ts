// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { canModerate, isOwner, MEMBER_DEFAULTS, MOD_ONLY, pinOwner, rankOf, roleLabel, rolesOf } from "./permissions.ts";

const admins = [
  { pubkey: "aa", roles: ["admin"] },
  { pubkey: "bb", roles: ["moderator"] },
];

describe("permissions", () => {
  it("lists roles and treats listed pubkeys as mods", () => {
    expect(rolesOf(admins, "aa")).toEqual(["admin"]);
    expect(roleLabel(["ceo"])).toBe("owner");
    expect(roleLabel(["moderator"])).toBe("mod");
    expect(roleLabel([])).toBe("member");
  });

  it("only listed admins moderate — empty 39001 is not a free-for-all", () => {
    expect(canModerate([], "cc")).toBe(false);
    expect(canModerate(admins, "aa")).toBe(true);
    expect(canModerate(admins, "cc")).toBe(false);
    expect(canModerate(admins, null)).toBe(false);
  });

  it("treats the first 39001 entry as owner even without a role string", () => {
    const roster = [
      { pubkey: "AA", roles: [] },
      { pubkey: "bb", roles: ["moderator"] },
    ];
    expect(rankOf(roster, "aa")).toBe("owner");
    expect(isOwner(roster, "aa")).toBe(true);
    expect(rankOf(roster, "bb")).toBe("mod");
    expect(rankOf(roster, "cc")).toBe("member");
  });

  it("pins a known founder when the relay roster is empty or incomplete", () => {
    const founder = "aa".repeat(32);
    expect(pinOwner([], founder)).toEqual([{ pubkey: founder, roles: ["owner"] }]);
    expect(pinOwner([{ pubkey: "bb", roles: ["moderator"] }], founder)).toEqual([
      { pubkey: founder, roles: ["owner"] },
      { pubkey: "bb", roles: ["moderator"] },
    ]);
    expect(pinOwner([{ pubkey: founder.toUpperCase(), roles: ["moderator"] }], founder)).toEqual([
      { pubkey: founder, roles: ["owner", "moderator"] },
    ]);
    expect(rankOf(pinOwner([], founder), founder)).toBe("owner");
    expect(pinOwner(admins, null)).toEqual(admins);
  });

  it("lists honest member defaults without inventing extra bits", () => {
    expect(MEMBER_DEFAULTS).toContain("speak");
    expect(MOD_ONLY).toContain("kick");
    expect(MOD_ONLY).not.toContain("speak");
  });
});
