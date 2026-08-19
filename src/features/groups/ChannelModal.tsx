// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ChannelKind } from "../../lib/nostr/nip29.ts";
import styles from "../auth/AuthScreen.module.css";
import modal from "./PraçaModal.module.css";
import { useGroupStore } from "./group-store.ts";

type Props = {
  onClose: () => void;
  defaultKind?: ChannelKind;
};

export function ChannelModal({ onClose, defaultKind = "text" }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ChannelKind>(defaultKind);
  const addChannel = useGroupStore((state) => state.addChannel);
  const busy = useGroupStore((state) => state.busy);
  const error = useGroupStore((state) => state.error);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return;
    await addChannel(name, kind);
    if (!useGroupStore.getState().error) onClose();
  }

  return (
    <div className={modal.backdrop} onClick={onClose} role="presentation">
      <section className={styles.card} onClick={(event) => event.stopPropagation()}>
        <div className={styles.callsign}>{t("app.name")}</div>
        <h1 className={styles.title}>{t("channels.addChannel")}</h1>
        <p className={styles.lead}>{kind === "voice" ? t("channels.addLeadVoice") : t("channels.addLead")}</p>
        <form className={styles.form} onSubmit={(event) => void submit(event)}>
          <label>
            {t("channels.name")}
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} />
          </label>
          <div className={modal.tabs}>
            <button type="button" className={modal.tab} data-on={kind === "text"} onClick={() => setKind("text")}>
              {t("channels.text")}
            </button>
            <button type="button" className={modal.tab} data-on={kind === "voice"} onClick={() => setKind("voice")}>
              {t("channels.voice")}
            </button>
          </div>
          {error ? <p className={styles.error}>{t(`groups.errors.${error}`, { defaultValue: error })}</p> : null}
          <button type="submit" className={styles.primary} disabled={busy || name.trim().length < 2}>
            {busy ? t("groups.working") : t("channels.addChannel")}
          </button>
          <button type="button" className={styles.ghost} onClick={onClose}>
            {t("auth.back")}
          </button>
        </form>
      </section>
    </div>
  );
}
