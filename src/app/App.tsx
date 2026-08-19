// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from "react";
import { AuthScreen } from "../features/auth/AuthScreen.tsx";
import { useAuthStore } from "../features/auth/auth-store.ts";
import { RevealScreen } from "../features/auth/RevealScreen.tsx";
import { useDesktopStore } from "../features/desktop/desktop-store.ts";
import { readInviteFromLocation, stashInvite } from "../lib/nostr/invite.ts";
import { Atmosphere } from "./atmosphere/Atmosphere.tsx";
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import styles from "./App.module.css";
import { enterAppGate, leaveAppGate, shouldSkipLanding } from "./landing/gate.ts";
import { Landing } from "./landing/Landing.tsx";
import { AppShell } from "./shell/AppShell.tsx";

export function App() {
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);
  const loadDesktop = useDesktopStore((state) => state.load);
  const [gate, setGate] = useState(shouldSkipLanding);

  useEffect(() => {
    const pending = readInviteFromLocation();
    if (pending) stashInvite(pending);
    void hydrate();
    void loadDesktop();
  }, [hydrate, loadDesktop]);

  const ready = status === "ready";
  const plaza = !gate && status !== "loading" && status !== "reveal";
  const needAuth = !plaza && (status === "setup" || status === "locked");

  return (
    <div className={styles.frame} data-landing={plaza ? "true" : "false"}>
      <Atmosphere intensity={plaza ? "plaza" : ready ? "room" : "stage"} />
      <div className={styles.ui}>
        {status === "loading" ? <div style={{ minHeight: "100dvh" }} /> : null}
        {plaza ? (
          <Landing
            onEnter={() => {
              enterAppGate();
              setGate(true);
            }}
          />
        ) : null}
        {status === "reveal" ? <RevealScreen /> : null}
        {needAuth ? (
          <AuthScreen
            onBack={() => {
              leaveAppGate();
              setGate(false);
            }}
          />
        ) : null}
        {!plaza && ready ? (
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        ) : null}
      </div>
    </div>
  );
}
