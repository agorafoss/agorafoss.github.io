// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { isRoomBox, openRoomText, sealRoomText } from "./room-box.ts";

describe("room box", () => {
  it("round-trips a private chat line and rejects the wrong password", async () => {
    const sealed = await sealRoomText("olá palco", "segredo-ok", "room-1");
    expect(isRoomBox(sealed)).toBe(true);
    expect(await openRoomText(sealed, "segredo-ok", "room-1")).toBe("olá palco");
    expect(await openRoomText(sealed, "outra", "room-1")).toBeNull();
    expect(await openRoomText("texto público", "segredo-ok", "room-1")).toBe("texto público");
  });
});
