import { Copy, GearSix, Hash, Plus, SignOut, SpeakerHigh, Translate } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/auth-store.ts";
import { useGroupStore } from "../../features/groups/group-store.ts";
import { useProfileStore } from "../../features/profile/profile-store.ts";
import { useRelayStore } from "../../features/relays/relay-store.ts";
import { changeLocale, type Locale } from "../../i18n/index.ts";
import { encodeGroupInvite } from "../../lib/nostr/invite.ts";
import { hueFromPubkey, shortenNpub } from "../../lib/nostr/nip19.ts";
import { groupKey, type Channel, type GroupRef } from "../../lib/nostr/nip29.ts";
import { Avatar } from "./Avatar.tsx";
import styles from "./ChannelList.module.css";
import { VuMeter } from "./VuMeter.tsx";

type Props = {
  group: GroupRef | null;
  channel: Channel | null;
  live?: boolean;
  onOpenSettings: () => void;
  onOpenSquare?: () => void;
  onAddChannel: () => void;
};

export function ChannelList({ group, channel, live, onOpenSettings, onOpenSquare, onAddChannel }: Props) {
  const { t, i18n } = useTranslation();
  const nextLocale: Locale = i18n.language === "en" ? "pt-BR" : "en";
  const npub = useAuthStore((state) => state.npub);
  const pubkey = useAuthStore((state) => state.pubkey);
  const callsign = useAuthStore((state) => state.callsign);
  const profile = useProfileStore((state) => state.own);
  const liveRelays = useRelayStore((state) => state.live);
  const channels = useGroupStore((state) => state.channels);
  const selectChannel = useGroupStore((state) => state.selectChannel);
  const leave = useGroupStore((state) => state.leave);
  const onStage = useGroupStore((state) => state.onStage);
  const moderate = useGroupStore((state) => state.canModerate());
  const displayName = profile.displayName || profile.name || callsign || (npub ? shortenNpub(npub) : t("app.name"));
  const connected = liveRelays.filter((relay) => relay.status === "connected").length;
  const text = channels.filter((item) => item.kind === "text");
  const voice = channels.filter((item) => item.kind === "voice");
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    if (!group) return;
    await navigator.clipboard.writeText(await encodeGroupInvite(group));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className={styles.pane} aria-label={group?.name ?? t("rail.label")}>
      <header className={styles.station}>
        <span className={styles.callsign}>{t("app.name")}</span>
        <h1 className={styles.name}>{group?.name ?? t("empty.serverTitle")}</h1>
        <span className={styles.relay}>
          {t("channels.relay")} · {group?.relay ?? t("status.clearnet")}
        </span>
        {group ? (
          <div className={styles.tools}>
            <button type="button" className={styles.invite} onClick={() => void copyInvite()}>
              <Copy size={14} />
              {copied ? t("groups.copied") : t("groups.copyInvite")}
            </button>
            {onOpenSquare ? (
              <button type="button" className={styles.iconBtn} title={t("square.title")} onClick={onOpenSquare}>
                <GearSix size={14} />
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className={styles.list}>
        {group ? (
          <>
            <div className={styles.category}>
              <div className={styles.catLabel}>
                <span>{t("channels.text")}</span>
                <span className={styles.tools}>
                  {moderate ? (
                    <button type="button" className={styles.iconBtn} onClick={onAddChannel} title={t("channels.addChannel")}>
                      <Plus size={12} />
                    </button>
                  ) : null}
                </span>
              </div>
              {(text.length ? text : channels.slice(0, 1)).map((item) => (
                <button
                  key={groupKey(item)}
                  type="button"
                  className={styles.channel}
                  data-active={channel ? groupKey(item) === groupKey(channel) : false}
                  onClick={() => void selectChannel(item)}
                >
                  <Hash className={styles.hash} size={15} />
                  <span className={styles.label}>{item.parent ? item.name : "geral"}</span>
                  {live && !item.parent ? <span className={styles.live}>{t("status.live")}</span> : null}
                </button>
              ))}
            </div>
            {voice.length > 0 ? (
              <div className={styles.category}>
                <div className={styles.catLabel}>
                  <span>{t("channels.voice")}</span>
                </div>
                {voice.map((item) => (
                  <button
                    key={groupKey(item)}
                    type="button"
                    className={styles.channel}
                    data-active={channel ? groupKey(item) === groupKey(channel) : false}
                    onClick={() => void selectChannel(item)}
                  >
                    <SpeakerHigh className={styles.voice} size={15} />
                    <span className={styles.label}>{item.name}</span>
                    {channel && groupKey(item) === groupKey(channel) && onStage.length > 0 ? (
                      <span className={styles.live}>{onStage.length}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className={styles.relay}>{t("empty.serverBody")}</p>
        )}
      </div>

      <footer className={styles.user}>
        <Avatar name={displayName} hue={hueFromPubkey(pubkey ?? "")} size={32} />
        <div className={styles.meta}>
          <div className={styles.userName}>{displayName}</div>
          <div className={styles.npub}>{callsign || (npub ? shortenNpub(npub) : "")}</div>
        </div>
        <div className={styles.tools}>
          <VuMeter level={Math.min(4, Math.max(1, connected))} live={connected > 0} />
          {group ? (
            <button type="button" className={styles.iconBtn} title={t("groups.leave")} onClick={() => void leave()}>
              <SignOut size={16} />
            </button>
          ) : null}
          <button
            type="button"
            className={styles.iconBtn}
            data-on={i18n.language === "en"}
            title={t("user.locale")}
            onClick={() => void changeLocale(nextLocale)}
          >
            <Translate size={16} />
          </button>
          <button type="button" className={styles.iconBtn} title={t("user.settings")} onClick={onOpenSettings}>
            <GearSix size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}
