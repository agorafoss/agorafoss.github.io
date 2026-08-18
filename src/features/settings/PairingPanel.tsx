import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../auth/auth-store.ts";
import styles from "../auth/AuthScreen.module.css";

export function PairingPanel() {
  const { t } = useTranslation();
  const pairingCode = useAuthStore((state) => state.pairingCode);
  const pairingExpiresAt = useAuthStore((state) => state.pairingExpiresAt);
  const startPairing = useAuthStore((state) => state.startPairing);
  const stopPairing = useAuthStore((state) => state.stopPairing);
  const error = useAuthStore((state) => state.error);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!pairingExpiresAt) return;
    const tick = () => setLeft(Math.max(0, pairingExpiresAt - Date.now()));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [pairingExpiresAt]);

  useEffect(() => {
    if (pairingExpiresAt && left === 0) stopPairing();
  }, [left, pairingExpiresAt, stopPairing]);

  const seconds = Math.ceil(left / 1000);

  return (
    <div className={styles.form}>
      <p className={styles.hint}>{t("auth.pairHostHint")}</p>
      {pairingCode ? (
        <>
          <p className={styles.cadeado}>{pairingCode}</p>
          <p className={styles.hint}>{t("auth.pairCountdown", { seconds })}</p>
          <button type="button" className={styles.secondary} onClick={stopPairing}>
            {t("auth.pairCancel")}
          </button>
        </>
      ) : (
        <button type="button" className={styles.primary} onClick={() => void startPairing()}>
          {t("auth.pairStart")}
        </button>
      )}
      {error ? <p className={styles.error}>{t(`auth.errors.${error}`)}</p> : null}
    </div>
  );
}
