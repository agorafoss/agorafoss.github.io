// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { X } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { encodeGroupInvite } from "../../lib/nostr/invite.ts";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import { MEMBER_DEFAULTS, MOD_ONLY, rankOf } from "../../lib/nostr/permissions.ts";
import { useChatStore } from "../chat/chat-store.ts";
import { useMuteStore } from "../mute/mute-store.ts";
import { useGroupStore } from "./group-store.ts";
import styles from "../settings/SettingsDrawer.module.css";

type Tab = "overview" | "channels" | "people" | "roles";

type Props = {
  onClose: () => void;
};

export function PraçaSettings({ onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("overview");
  const group = useGroupStore((state) => state.active());
  const channels = useGroupStore((state) => state.channels);
  const root = channels.find((item) => !item.parent) ?? channels[0];
  const members = useGroupStore((state) => state.members) ?? [];
  const admins = useGroupStore((state) => state.admins) ?? [];
  const roleNames = useGroupStore((state) => state.roleNames) ?? [];
  const owner = useGroupStore((state) => state.isOwner());
  const busy = useGroupStore((state) => state.busy);
  const error = useGroupStore((state) => state.error);
  const editMeta = useGroupStore((state) => state.editMeta);
  const kick = useGroupStore((state) => state.kick);
  const setRole = useGroupStore((state) => state.setRole);
  const leave = useGroupStore((state) => state.leave);
  const names = useChatStore((state) => state.names) ?? {};
  const chatMessages = useChatStore((state) => state.messages);
  const mutePubkey = useMuteStore((state) => state.mutePubkey);
  const [name, setName] = useState(group?.name ?? "");
  const [about, setAbout] = useState(root?.about ?? "");
  const [copied, setCopied] = useState(false);
  const [customRole, setCustomRole] = useState("moderator");
  const people = [
    ...new Set([...members, ...admins.map((admin) => admin.pubkey), ...chatMessages.map((message) => message.pubkey)]),
  ];

  if (!group) return null;
  const square = group;

  async function save(event: FormEvent) {
    event.preventDefault();
    await editMeta(name, about);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(await encodeGroupInvite(square));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <aside className={styles.panel} onClick={(event) => event.stopPropagation()} aria-label={t("square.title")}>
        <header className={styles.head}>
          <h2 className={styles.title}>{t("square.title")}</h2>
          <button type="button" className={styles.close} onClick={onClose} title={t("settings.close")}>
            <X size={16} />
          </button>
        </header>
        <div className={styles.tabs}>
          {(["overview", "channels", "people", "roles"] as const).map((item) => (
            <button key={item} type="button" className={styles.tab} data-on={tab === item} onClick={() => setTab(item)}>
              {t(`square.tabs.${item}`)}
            </button>
          ))}
        </div>
        <div className={styles.body}>
          {tab === "overview" ? (
            <form onSubmit={(event) => void save(event)}>
              <p className={styles.hint}>
                {square.id} · {square.relay}
              </p>
              <label>
                {t("groups.name")}
                <input value={name} onChange={(event) => setName(event.target.value)} disabled={!owner} />
              </label>
              <label>
                {t("square.rules")}
                <textarea value={about} onChange={(event) => setAbout(event.target.value)} disabled={!owner} rows={3} />
              </label>
              {owner ? (
                <button type="submit" className={styles.ghost} disabled={busy || name.trim().length < 2}>
                  {t("square.save")}
                </button>
              ) : (
                <p className={styles.hint}>{t("square.memberOnly")}</p>
              )}
              <button type="button" className={styles.ghost} onClick={() => void copyInvite()}>
                {copied ? t("groups.copied") : t("groups.copyInvite")}
              </button>
            </form>
          ) : null}

          {tab === "channels" ? (
            <>
              {owner ? <p className={styles.hint}>{t("channels.addLead")}</p> : null}
              <ul className={styles.list}>
                {channels.map((channel) => (
                  <li key={`${channel.relay}#${channel.id}`}>
                    <strong>#{channel.parent ? channel.name : "geral"}</strong>
                    <span>{channel.kind === "voice" ? t("channels.voice") : t("channels.text")}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {tab === "people" ? (
            <ul className={styles.list}>
              {people.length === 0 ? <li>{t("square.nobody")}</li> : null}
              {people.map((pubkey) => {
                const rank = rankOf(admins, pubkey);
                return (
                  <li key={pubkey}>
                    <strong>{names[pubkey] || publicCallsign(pubkey)}</strong>
                    <span>{t(`members.${rank}`)}</span>
                    {owner && rank !== "owner" ? (
                      <>
                        <button type="button" className={styles.ghost} onClick={() => void mutePubkey(pubkey)}>
                          {t("mute.pubkey")}
                        </button>
                        <button type="button" className={styles.danger} onClick={() => void kick(pubkey)}>
                          {t("members.kick")}
                        </button>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {tab === "roles" ? (
            <div>
              <p className={styles.hint}>{t("square.modLead")}</p>
              <ul className={styles.list}>
                {MEMBER_DEFAULTS.map((item) => (
                  <li key={item}>{t(`square.defaults.${item}`)}</li>
                ))}
                {MOD_ONLY.map((item) => (
                  <li key={`mod-${item}`}>{t(`square.mods.${item}`)}</li>
                ))}
              </ul>
              {owner ? (
                <label>
                  {t("square.assignRole")}
                  <input value={customRole} onChange={(event) => setCustomRole(event.target.value)} list="agora-roles" />
                  <datalist id="agora-roles">
                    {roleNames.map((role) => (
                      <option key={role} value={role} />
                    ))}
                  </datalist>
                </label>
              ) : null}
              <ul className={styles.list}>
                {people.length === 0 ? <li>{t("square.nobody")}</li> : null}
                {people.map((pubkey) => {
                  const rank = rankOf(admins, pubkey);
                  return (
                    <li key={pubkey}>
                      <strong>{names[pubkey] || publicCallsign(pubkey)}</strong>
                      <span>{t(`members.${rank}`)}</span>
                      {owner && rank !== "owner" ? (
                        <>
                          <button type="button" className={styles.ghost} onClick={() => void setRole(pubkey, customRole || "moderator")}>
                            {t("square.promote")}
                          </button>
                          <button type="button" className={styles.ghost} onClick={() => void setRole(pubkey, "")}>
                            {t("square.demote")}
                          </button>
                          <button type="button" className={styles.danger} onClick={() => void kick(pubkey)}>
                            {t("members.kick")}
                          </button>
                        </>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {error ? <p className={styles.error}>{t(`groups.errors.${error}`)}</p> : null}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.danger}
            onClick={() => {
              if (!window.confirm(t("groups.leave"))) return;
              void leave();
              onClose();
            }}
          >
            {t("groups.leave")}
          </button>
        </div>
      </aside>
    </div>
  );
}
