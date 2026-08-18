// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useTranslation } from "react-i18next";
import { DEFAULT_RELAYS } from "../../lib/nostr/relays.ts";
import { isOnionRelay } from "../../lib/nostr/tor.ts";
import styles from "../relays/RelayPanel.module.css";
import { useTorStore } from "./tor-store.ts";

export function TorPanel() {
  const { t } = useTranslation();
  const enabled = useTorStore((state) => state.enabled);
  const socksHost = useTorStore((state) => state.socksHost);
  const socksPort = useTorStore((state) => state.socksPort);
  const onionRelays = useTorStore((state) => state.onionRelays);
  const health = useTorStore((state) => state.health);
  const save = useTorStore((state) => state.save);

  return (
    <div>
      <p className={styles.hint}>{t("tor.hint")}</p>
      <label className={styles.row}>
        <input type="checkbox" checked={enabled} onChange={(event) => void save({ enabled: event.target.checked })} />
        <span className={styles.url}>{t("tor.enable")}</span>
      </label>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <input
          value={socksHost}
          onChange={(event) => void save({ socksHost: event.target.value })}
          placeholder="127.0.0.1"
          spellCheck={false}
        />
        <input
          value={String(socksPort)}
          onChange={(event) => void save({ socksPort: Number(event.target.value) || 9050 })}
          placeholder="9050"
        />
      </form>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const url = String(form.get("onion") ?? "").trim();
          if (!isOnionRelay(url)) return;
          void save({ onionRelays: [...onionRelays.filter((item) => item !== url), url] });
          event.currentTarget.reset();
        }}
      >
        <input name="onion" placeholder="ws://relay.onion" spellCheck={false} />
        <button type="submit" className={styles.add}>
          {t("relays.add")}
        </button>
      </form>
      <div className={styles.list}>
        {onionRelays.map((url) => (
          <div key={url} className={styles.row}>
            <span className={styles.dot} data-status={health === "ready" ? "connected" : "disconnected"} />
            <span className={styles.url}>{url}</span>
            <button
              type="button"
              className={styles.remove}
              onClick={() => void save({ onionRelays: onionRelays.filter((item) => item !== url) })}
            >
              {t("relays.remove")}
            </button>
          </div>
        ))}
      </div>
      <p className={styles.hint}>{t(`tor.health.${health}`)}</p>
      <p className={styles.hint}>
        {t("tor.clearnetHint")} {DEFAULT_RELAYS[0]}
      </p>
    </div>
  );
}
