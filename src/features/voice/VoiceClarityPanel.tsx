// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useTranslation } from "react-i18next";
import styles from "../relays/RelayPanel.module.css";
import panel from "./VoiceClarityPanel.module.css";
import { useClarityStore } from "./clarity-store.ts";
import { useVoiceStore } from "./voice-store.ts";

export function VoiceClarityPanel() {
  const { t } = useTranslation();
  const enabled = useClarityStore((state) => state.enabled);
  const suppression = useClarityStore((state) => state.suppression);
  const status = useClarityStore((state) => state.status);
  const setEnabled = useClarityStore((state) => state.setEnabled);
  const setSuppression = useClarityStore((state) => state.setSuppression);
  const retune = useVoiceStore((state) => state.retuneClarity);

  return (
    <div>
      <p className={styles.hint}>{t("clarity.hint")}</p>
      <label className={panel.check}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            setEnabled(event.target.checked);
            void retune();
          }}
        />
        {t("clarity.enabled")}
      </label>
      <label className={panel.slide}>
        <span>
          {t("clarity.suppression")} · {suppression}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={suppression}
          disabled={!enabled}
          onChange={(event) => {
            setSuppression(Number(event.target.value));
            void retune();
          }}
        />
      </label>
      <p className={styles.hint}>{t(`clarity.status.${status}`)}</p>
    </div>
  );
}
