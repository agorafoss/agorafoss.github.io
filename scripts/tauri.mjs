// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

const env = { ...process.env };
if (process.platform === "win32" && process.cwd().includes(" ")) {
  env.CARGO_TARGET_DIR = path.join(os.homedir(), "agora-target");
}

const child = spawn("pnpm", ["exec", "tauri", ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
