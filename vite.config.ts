// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Tailscale Serve/Funnel chega com Host: *.ts.net; sem isso o Vite responde 403.
    allowedHosts: [".ts.net", "desktop-hb6vhr6.tail96debd.ts.net"],
  },
});
