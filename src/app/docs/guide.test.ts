// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { GUIDE_SECTION_IDS, guideFor } from "./guide.ts";

describe("docs guide", () => {
  it("keeps the same section ids in Portuguese and English", () => {
    const pt = guideFor("pt-BR");
    const en = guideFor("en");
    expect(pt.sections.map((section) => section.id)).toEqual(GUIDE_SECTION_IDS);
    expect(en.sections.map((section) => section.id)).toEqual(GUIDE_SECTION_IDS);
    expect(GUIDE_SECTION_IDS).toContain("identidade");
    expect(GUIDE_SECTION_IDS).toContain("sala-privada");
  });

  it("says the room key is not the twelve words", () => {
    const room = guideFor("pt-BR").sections.find((section) => section.id === "sala-privada");
    const blob = JSON.stringify(room);
    expect(blob).toMatch(/não são as 12 palavras|não da sua conta/i);
    expect(blob).toMatch(/envelope/i);
  });
});
