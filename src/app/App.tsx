import { useEffect } from "react";
import { AuthScreen } from "../features/auth/AuthScreen.tsx";
import { useAuthStore } from "../features/auth/auth-store.ts";
import { RevealScreen } from "../features/auth/RevealScreen.tsx";
import { readInviteFromLocation, stashInvite } from "../lib/nostr/invite.ts";
import { Atmosphere } from "./atmosphere/Atmosphere.tsx";
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import styles from "./App.module.css";
import { AppShell } from "./shell/AppShell.tsx";

export function App() {
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    const pending = readInviteFromLocation();
    if (pending) stashInvite(pending);
    void hydrate();
  }, [hydrate]);

  const ready = status === "ready";
  const stage = status === "setup" || status === "locked" || status === "reveal";

  return (
    <div className={styles.frame}>
      <Atmosphere intensity={ready ? "room" : "stage"} />
      <div className={styles.ui}>
        {status === "loading" ? <div style={{ minHeight: "100dvh" }} /> : null}
        {status === "reveal" ? <RevealScreen /> : null}
        {stage && status !== "reveal" ? <AuthScreen /> : null}
        {ready ? (
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        ) : null}
      </div>
    </div>
  );
}
