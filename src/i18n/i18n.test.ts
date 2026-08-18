// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";
import i18n, { changeLocale, i18nReady } from "./index.ts";

describe("i18n", () => {
  beforeAll(async () => {
    await i18nReady;
    await changeLocale("pt-BR");
  });

  it("starts in Portuguese", () => {
    expect(i18n.t("chat.send")).toBe("Enviar");
    expect(i18n.t("status.live")).toBe("no ar");
  });

  it("switches visible shell copy to English", async () => {
    await changeLocale("en");
    expect(i18n.t("chat.send")).toBe("Send");
    expect(i18n.t("status.live")).toBe("on air");
    await changeLocale("pt-BR");
    expect(i18n.t("chat.send")).toBe("Enviar");
  });
});
