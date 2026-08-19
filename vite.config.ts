// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

const MODEL_PATH = "/deepfilternet3/v3/models/DeepFilterNet3_onnx.tar.gz";
const modelFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "public/deepfilternet3/v3/models/DeepFilterNet3_onnx.tar.gz",
);

/** Vite/sirv marca .gz como Content-Encoding; o fetch descompacta e o DeepFilterNet quebra. */
function serveRawTarGz() {
  const handle = (req: { url?: string }, res: import("node:http").ServerResponse, next: () => void) => {
    const url = req.url?.split("?")[0] ?? "";
    if (!url.endsWith(MODEL_PATH)) {
      next();
      return;
    }
    const buf = readFileSync(modelFile);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/gzip");
    res.setHeader("Content-Length", String(buf.length));
    res.end(buf);
  };
  return {
    name: "agora-raw-tar-gz",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server: ViteDevServer) {
      server.middlewares.use(handle);
    },
  };
}

export default defineConfig({
  plugins: [react(), serveRawTarGz()],
  base: "/",
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Tailscale Serve/Funnel chega com Host: *.ts.net; sem isso o Vite responde 403.
    allowedHosts: [".ts.net", "desktop-hb6vhr6.tail96debd.ts.net"],
  },
});
