// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GearSix, Hash, Plus, SignOut, SpeakerHigh, Translate } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/auth-store.ts";
import { useGroupStore } from "../../features/groups/group-store.ts";
import { useProfileStore } from "../../features/profile/profile-store.ts";
import { useRelayStore } from "../../features/relays/relay-store.ts";
import { changeLocale, type Locale } from "../../i18n/index.ts";
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
  onAddChannel: (kind?: "text" | "voice") => void;
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
  const owner = useGroupStore((state) => state.isOwner());
  const canAdd = owner || moderate;
  const displayName = profile.displayName || profile.name || callsign || (npub ? shortenNpub(npub) : t("app.name"));
  const connected = liveRelays.filter((relay) => relay.status === "connected").length;
  const text = channels.filter((item) => item.kind === "text");
  const voice = channels.filter((item) => item.kind === "voice");

  return (
    <section className={styles.pane} aria-label={group?.name ?? t("rail.label")}>
      <header className={styles.station}>
        <span className={styles.callsign}>{t("app.name")}</span>
        <div className={styles.titleRow}>
          <h1 className={styles.name}>{group?.name ?? t("empty.serverTitle")}</h1>
        </div>
        <span className={styles.relay}>
          {t("channels.relay")} · {group?.relay ?? t("status.clearnet")}
        </span>
        {group && onOpenSquare ? (
          <button type="button" className={styles.squareRow} onClick={onOpenSquare}>
            <GearSix size={16} />
            <span>{t("square.title")}</span>
          </button>
        ) : null}
      </header>

      <div className={styles.list}>
        {group ? (
          <>
            <div className={styles.category}>
              <div className={styles.catLabel}>{t("channels.text")}</div>
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
              {canAdd ? (
                <button type="button" className={styles.addRow} onClick={() => onAddChannel("text")}>
                  <Plus size={14} />
                  <span>{t("channels.addText")}</span>
                </button>
              ) : null}
            </div>
            <div className={styles.category}>
              <div className={styles.catLabel}>{t("channels.voice")}</div>
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
              {canAdd ? (
                <button type="button" className={styles.addRow} onClick={() => onAddChannel("voice")}>
                  <Plus size={14} />
                  <span>{t("channels.addVoice")}</span>
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p className={styles.relay}>{t("empty.serverBody")}</p>
        )}
      </div>

      <footer className={styles.user}>
        <Avatar name={displayName} hue={hueFromPubkey(pubkey ?? "")} size={32} picture={profile.picture} />
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
