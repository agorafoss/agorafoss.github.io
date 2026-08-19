// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../auth/AuthScreen.module.css";

type Props = {
  secret: string;
  onDone: () => void;
};

export function RoomKeyReveal({ secret, onDone }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  return (
    <>
      <h1 className={styles.title}>{t("channels.keyTitle")}</h1>
      <p className={styles.lead}>{t("channels.keyLead")}</p>
      <p className={styles.lead}>{t("channels.keyWarn")}</p>
      <p className={styles.cadeado}>{secret}</p>
      <button
        type="button"
        className={styles.primary}
        onClick={() => {
          void navigator.clipboard.writeText(secret).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? t("channels.keyCopied") : t("channels.keyCopy")}
      </button>
      <button type="button" className={styles.ghost} onClick={onDone}>
        {t("channels.keyDone")}
      </button>
    </>
  );
}
