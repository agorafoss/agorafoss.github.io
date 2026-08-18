// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useRelayStore } from "./relay-store.ts";
import styles from "./RelayPanel.module.css";

export function RelayPanel() {
  const { t } = useTranslation();
  const urls = useRelayStore((state) => state.urls);
  const live = useRelayStore((state) => state.live);
  const error = useRelayStore((state) => state.error);
  const add = useRelayStore((state) => state.add);
  const remove = useRelayStore((state) => state.remove);
  const [draft, setDraft] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    void add(draft).then(() => setDraft(""));
  }

  return (
    <div>
      <div className={styles.list}>
        {urls.map((url) => {
          const info = live.find((item) => item.url === url || item.url === `${url}/`);
          return (
            <div key={url} className={styles.row}>
              <span className={styles.dot} data-status={info?.status ?? "disconnected"} />
              <span className={styles.url}>{url}</span>
              <button type="button" className={styles.remove} onClick={() => void remove(url)}>
                {t("relays.remove")}
              </button>
            </div>
          );
        })}
      </div>
      <form className={styles.form} onSubmit={submit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="wss://relay.exemplo"
          spellCheck={false}
        />
        <button type="submit" className={styles.add}>
          {t("relays.add")}
        </button>
      </form>
      {error ? <p className={styles.error}>{t(`relays.errors.${error}`)}</p> : null}
      <p className={styles.hint}>{t("relays.hint")}</p>
    </div>
  );
}
