// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { create } from "zustand";
import { probeDesktop } from "../../lib/desktop/runtime.ts";

type DesktopState = {
  desktop: boolean;
  ready: boolean;
  load: () => Promise<void>;
};

export const useDesktopStore = create<DesktopState>((set) => ({
  desktop: false,
  ready: false,
  load: async () => {
    const info = await probeDesktop();
    set({ desktop: info.desktop, ready: true });
  },
}));
