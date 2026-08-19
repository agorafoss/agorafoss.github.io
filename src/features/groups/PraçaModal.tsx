// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { CREATE_RELAY, relayCreatesGroupsOnWeb } from "../../lib/nostr/relays.ts";
import { useGroupStore } from "./group-store.ts";
import styles from "../auth/AuthScreen.module.css";
import modal from "./PraçaModal.module.css";
import { RoomKeyReveal } from "./RoomKeyReveal.tsx";

type Tab = "create" | "join";

type Props = {
  onClose: () => void;
};

export function PraçaModal({ onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("create");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [relay, setRelay] = useState(CREATE_RELAY);
  const [code, setCode] = useState("");
  const [locked, setLocked] = useState(false);
  const [reveal, setReveal] = useState<string | null>(null);
  const create = useGroupStore((state) => state.create);
  const join = useGroupStore((state) => state.join);
  const busy = useGroupStore((state) => state.busy);
  const error = useGroupStore((state) => state.error);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (tab === "create") {
      const secret = await create(name, relay, locked);
      if (useGroupStore.getState().error) return;
      if (secret) setReveal(secret);
      else onClose();
    } else {
      await join(id, relay, code);
      if (!useGroupStore.getState().error) onClose();
    }
  }

  return (
    <div className={modal.backdrop} onClick={reveal ? undefined : onClose} role="presentation">
      <section className={styles.card} onClick={(event) => event.stopPropagation()}>
        <div className={styles.callsign}>{t("app.name")}</div>
        {reveal ? (
          <RoomKeyReveal secret={reveal} onDone={onClose} />
        ) : (
          <>
            <h1 className={styles.title}>{tab === "create" ? t("groups.createTitle") : t("groups.joinTitle")}</h1>
            <p className={styles.lead}>{tab === "create" ? t("groups.createLead") : t("groups.joinLead")}</p>
            <div className={modal.tabs}>
              <button type="button" className={modal.tab} data-on={tab === "create"} onClick={() => setTab("create")}>
                {t("groups.create")}
              </button>
              <button type="button" className={modal.tab} data-on={tab === "join"} onClick={() => setTab("join")}>
                {t("groups.join")}
              </button>
            </div>
            <form className={styles.form} onSubmit={(event) => void submit(event)}>
              {tab === "create" ? (
                <>
                  <label>
                    {t("groups.name")}
                    <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} />
                  </label>
                  <label>
                    {t("groups.relay")}
                    <input value={relay} onChange={(event) => setRelay(event.target.value)} spellCheck={false} />
                  </label>
                  {relayCreatesGroupsOnWeb(relay) ? <p className={styles.error}>{t("groups.fiatjafWeb")}</p> : null}
                  <label className={modal.check}>
                    <input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} />
                    {t("channels.private")}
                  </label>
                  {locked ? <p className={styles.lead}>{t("channels.privateLead")}</p> : null}
                </>
              ) : (
                <>
                  <label>
                    {t("groups.id")}
                    <input
                      value={id}
                      onChange={(event) => setId(event.target.value)}
                      placeholder={t("groups.invitePaste")}
                      spellCheck={false}
                    />
                  </label>
                  <label>
                    {t("groups.relay")}
                    <input value={relay} onChange={(event) => setRelay(event.target.value)} spellCheck={false} />
                  </label>
                  <label>
                    {t("groups.code")}
                    <input value={code} onChange={(event) => setCode(event.target.value)} />
                  </label>
                </>
              )}
              {error ? (
                <p className={styles.error}>{error.startsWith("group-") ? t(`groups.errors.${error}`) : error}</p>
              ) : null}
              <button type="submit" className={styles.primary} disabled={busy}>
                {busy ? t("groups.working") : tab === "create" ? t("groups.create") : t("groups.join")}
              </button>
              <button type="button" className={styles.ghost} onClick={onClose}>
                {t("auth.back")}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
