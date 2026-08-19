// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { X } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../auth/auth-store.ts";
import { MutePanel } from "../mute/MutePanel.tsx";
import { ProfileEditor } from "../profile/ProfileEditor.tsx";
import { RelayPanel } from "../relays/RelayPanel.tsx";
import { TorPanel } from "../tor/TorPanel.tsx";
import { PairingPanel } from "./PairingPanel.tsx";
import { VoiceClarityPanel } from "../voice/VoiceClarityPanel.tsx";
import styles from "./SettingsDrawer.module.css";

type Tab = "profile" | "relays" | "pair" | "mute" | "tor" | "voice";

type Props = {
  onClose: () => void;
};

export function SettingsDrawer({ onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("profile");
  const lock = useAuthStore((state) => state.lock);
  const forget = useAuthStore((state) => state.forget);

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <aside
        className={styles.panel}
        onClick={(event) => event.stopPropagation()}
        aria-label={t("user.settings")}
      >
        <header className={styles.head}>
          <h2 className={styles.title}>{t("user.settings")}</h2>
          <button type="button" className={styles.close} onClick={onClose} title={t("settings.close")}>
            <X size={16} />
          </button>
        </header>
        <div className={styles.tabs}>
          <button type="button" className={styles.tab} data-on={tab === "profile"} onClick={() => setTab("profile")}>
            {t("settings.profile")}
          </button>
          <button type="button" className={styles.tab} data-on={tab === "relays"} onClick={() => setTab("relays")}>
            {t("settings.relays")}
          </button>
          <button type="button" className={styles.tab} data-on={tab === "pair"} onClick={() => setTab("pair")}>
            {t("settings.pair")}
          </button>
          <button type="button" className={styles.tab} data-on={tab === "mute"} onClick={() => setTab("mute")}>
            {t("settings.mute")}
          </button>
          <button type="button" className={styles.tab} data-on={tab === "tor"} onClick={() => setTab("tor")}>
            {t("settings.tor")}
          </button>
          <button type="button" className={styles.tab} data-on={tab === "voice"} onClick={() => setTab("voice")}>
            {t("settings.voice")}
          </button>
        </div>
        <div className={styles.body}>
          {tab === "profile" ? (
            <ProfileEditor />
          ) : tab === "relays" ? (
            <RelayPanel />
          ) : tab === "pair" ? (
            <PairingPanel />
          ) : tab === "mute" ? (
            <MutePanel />
          ) : tab === "voice" ? (
            <VoiceClarityPanel />
          ) : (
            <TorPanel />
          )}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={() => void lock()}>
            {t("auth.lock")}
          </button>
          <button type="button" className={styles.danger} onClick={() => void forget()}>
            {t("auth.forget")}
          </button>
        </div>
      </aside>
    </div>
  );
}
