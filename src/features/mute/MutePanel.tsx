// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import styles from "../relays/RelayPanel.module.css";
import { useMuteStore } from "./mute-store.ts";

export function MutePanel() {
  const { t } = useTranslation();
  const list = useMuteStore((state) => state.list);
  const error = useMuteStore((state) => state.error);
  const mutePubkey = useMuteStore((state) => state.mutePubkey);
  const muteWord = useMuteStore((state) => state.muteWord);
  const [word, setWord] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    void muteWord(word).then(() => setWord(""));
  }

  return (
    <div>
      <p className={styles.hint}>{t("mute.hint")}</p>
      <div className={styles.list}>
        {list.pubkeys.map((pubkey) => (
          <div key={pubkey} className={styles.row}>
            <span className={styles.dot} data-status="error" />
            <span className={styles.url}>{publicCallsign(pubkey)}</span>
            <button type="button" className={styles.remove} onClick={() => void mutePubkey(pubkey)}>
              {t("mute.unmute")}
            </button>
          </div>
        ))}
        {list.words.map((item) => (
          <div key={item} className={styles.row}>
            <span className={styles.dot} />
            <span className={styles.url}>{item}</span>
            <button type="button" className={styles.remove} onClick={() => void muteWord(item)}>
              {t("mute.unmute")}
            </button>
          </div>
        ))}
      </div>
      <form className={styles.form} onSubmit={submit}>
        <input value={word} onChange={(event) => setWord(event.target.value)} placeholder={t("mute.word")} />
        <button type="submit" className={styles.add}>
          {t("mute.add")}
        </button>
      </form>
      {error ? <p className={styles.error}>{t(`mute.errors.${error}`)}</p> : null}
    </div>
  );
}
