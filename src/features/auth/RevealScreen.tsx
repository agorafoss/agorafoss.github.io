// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { splitMnemonic } from "../../lib/nostr/mnemonic.ts";
import { useAuthStore } from "./auth-store.ts";
import { DraggableCard } from "./DraggableCard.tsx";
import styles from "./AuthScreen.module.css";

export function RevealScreen() {
  const { t } = useTranslation();
  const reveal = useAuthStore((state) => state.reveal);
  const callsign = useAuthStore((state) => state.callsign);
  const confirmReveal = useAuthStore((state) => state.confirmReveal);
  const [kept, setKept] = useState(false);
  const [copiedLock, setCopiedLock] = useState(false);
  const [copiedWords, setCopiedWords] = useState(false);
  const [copiedNsec, setCopiedNsec] = useState(false);
  const words = reveal?.mnemonic ? splitMnemonic(reveal.mnemonic) : [];

  async function copy(value: string, kind: "lock" | "words" | "nsec") {
    await navigator.clipboard.writeText(value);
    if (kind === "lock") setCopiedLock(true);
    else if (kind === "nsec") setCopiedNsec(true);
    else setCopiedWords(true);
  }

  if (!reveal) return null;

  return (
    <main className={styles.screen}>
      <DraggableCard wide>
        <div className={styles.callsign}>
          <span>{t("app.name")}</span>
          {callsign ? <span>{callsign}</span> : null}
        </div>
        <h1 className={styles.title}>{t("auth.revealTitle")}</h1>
        <p className={styles.lead}>{t("auth.revealLead")}</p>

        <p className={styles.hint}>{t("auth.cadeadoHint")}</p>
        <p className={styles.cadeado}>{reveal.cadeado}</p>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => void copy(reveal.cadeado, "lock")}
        >
          {copiedLock ? t("auth.copied") : t("auth.copyCadeado")}
        </button>

        {words.length === 12 ? (
          <>
            <p className={styles.hint}>{t("auth.wordsHint")}</p>
            <ol className={styles.words}>
              {words.map((word, index) => (
                <li key={`${word}-${index}`} className={styles.word}>
                  <i>{index + 1}</i>
                  {word}
                </li>
              ))}
            </ol>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => void copy(words.join(" "), "words")}
            >
              {copiedWords ? t("auth.copied") : t("auth.copyWords")}
            </button>
          </>
        ) : (
          <p className={styles.hint}>{t("auth.newDeviceLock")}</p>
        )}

        {reveal.nsec ? (
          <>
            <p className={styles.hint}>{t("auth.nsecHint")}</p>
            <p className={styles.nsec}>{reveal.nsec}</p>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => void copy(reveal.nsec ?? "", "nsec")}
            >
              {copiedNsec ? t("auth.copied") : t("auth.copyNsec")}
            </button>
          </>
        ) : null}

        <label className={styles.check}>
          <input type="checkbox" checked={kept} onChange={(event) => setKept(event.target.checked)} />
          <span>{words.length === 12 ? t("auth.keptSecrets") : t("auth.keptCadeado")}</span>
        </label>
        <button
          type="button"
          className={styles.primary}
          disabled={!kept}
          onClick={() => void confirmReveal()}
        >
          {t("auth.enter")}
        </button>
      </DraggableCard>
    </main>
  );
}
