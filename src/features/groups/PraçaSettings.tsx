import { X } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { encodeGroupInvite } from "../../lib/nostr/invite.ts";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import { MEMBER_DEFAULTS, MOD_ONLY, roleLabel } from "../../lib/nostr/permissions.ts";
import { useChatStore } from "../chat/chat-store.ts";
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
  const moderate = useGroupStore((state) => state.canModerate());
  const busy = useGroupStore((state) => state.busy);
  const error = useGroupStore((state) => state.error);
  const editMeta = useGroupStore((state) => state.editMeta);
  const kick = useGroupStore((state) => state.kick);
  const setRole = useGroupStore((state) => state.setRole);
  const leave = useGroupStore((state) => state.leave);
  const names = useChatStore((state) => state.names) ?? {};
  const [name, setName] = useState(group?.name ?? "");
  const [about, setAbout] = useState(root?.about ?? "");
  const [copied, setCopied] = useState(false);

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
                <input value={name} onChange={(event) => setName(event.target.value)} disabled={!moderate} />
              </label>
              <label>
                {t("profile.about")}
                <textarea value={about} onChange={(event) => setAbout(event.target.value)} disabled={!moderate} rows={3} />
              </label>
              {moderate ? (
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
            <ul className={styles.list}>
              {channels.map((channel) => (
                <li key={`${channel.relay}#${channel.id}`}>
                  <strong>#{channel.parent ? channel.name : "geral"}</strong>
                  <span>{channel.kind === "voice" ? t("channels.voice") : t("channels.text")}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {tab === "people" ? (
            <ul className={styles.list}>
              {members.map((pubkey) => {
                const rank = roleLabel(admins.find((admin) => admin.pubkey === pubkey)?.roles ?? []);
                return (
                  <li key={pubkey}>
                    <strong>{names[pubkey] || publicCallsign(pubkey)}</strong>
                    <span>{t(`members.${rank}`)}</span>
                    {moderate && rank !== "owner" ? (
                      <button type="button" className={styles.danger} onClick={() => void kick(pubkey)}>
                        {t("members.kick")}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {tab === "roles" ? (
            <div>
              <p className={styles.hint}>{t("square.defaultsLead")}</p>
              <ul className={styles.list}>
                {MEMBER_DEFAULTS.map((item) => (
                  <li key={item}>{t(`square.defaults.${item}`)}</li>
                ))}
              </ul>
              <p className={styles.hint}>{t("square.modLead")}</p>
              <ul className={styles.list}>
                {MOD_ONLY.map((item) => (
                  <li key={item}>{t(`square.mods.${item}`)}</li>
                ))}
              </ul>
              <ul className={styles.list}>
                {members.map((pubkey) => {
                  const rank = roleLabel(admins.find((admin) => admin.pubkey === pubkey)?.roles ?? []);
                  return (
                    <li key={pubkey}>
                      <strong>{names[pubkey] || publicCallsign(pubkey)}</strong>
                      <span>{t(`members.${rank}`)}</span>
                      {moderate && rank !== "owner" ? (
                        <button
                          type="button"
                          className={styles.ghost}
                          onClick={() => void setRole(pubkey, rank === "mod" ? "" : "moderator")}
                        >
                          {t(rank === "mod" ? "square.demote" : "square.promote")}
                        </button>
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
