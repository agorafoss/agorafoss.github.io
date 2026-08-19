// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChatCircle, SpeakerSlash, UserMinus } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/auth-store.ts";
import { useChatStore } from "../../features/chat/chat-store.ts";
import { useGroupStore } from "../../features/groups/group-store.ts";
import { useMuteStore } from "../../features/mute/mute-store.ts";
import { useProfileStore } from "../../features/profile/profile-store.ts";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import { hueFromPubkey } from "../../lib/nostr/nip19.ts";
import { rankOf, type GroupAdmin } from "../../lib/nostr/permissions.ts";
import { Avatar } from "./Avatar.tsx";
import { ProfileCard } from "./ProfileCard.tsx";
import styles from "./MemberList.module.css";

type Props = {
  members: string[];
  onDm?: (pubkey: string) => void;
};

type Rank = "owner" | "mod" | "member";

function buckets(people: string[], admins: GroupAdmin[]): Record<Rank, string[]> {
  const grouped: Record<Rank, string[]> = { owner: [], mod: [], member: [] };
  for (const pubkey of people) {
    grouped[rankOf(admins, pubkey)].push(pubkey);
  }
  return grouped;
}

export function MemberList({ members, onDm }: Props) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<string | null>(null);
  const names = useChatStore((state) => state.names) ?? {};
  const pictures = useChatStore((state) => state.pictures) ?? {};
  const ownPicture = useProfileStore((state) => state.own.picture);
  const chatMessages = useChatStore((state) => state.messages);
  const me = useAuthStore((state) => state.pubkey);
  const admins = useGroupStore((state) => state.admins) ?? [];
  const kick = useGroupStore((state) => state.kick);
  const moderate = useGroupStore((state) => state.canModerate());
  const mutePubkey = useMuteStore((state) => state.mutePubkey);
  const muted = useMuteStore((state) => state.list?.pubkeys) ?? [];
  const onStage = useGroupStore((state) => state.onStage) ?? [];
  const people = [
    ...new Set([
      ...(me ? [me] : []),
      ...(members ?? []),
      ...admins.map((admin) => admin.pubkey),
      ...onStage,
      ...chatMessages.map((message) => message.pubkey),
    ]),
  ];
  const groups = buckets(people, admins);
  const onStageSet = new Set(onStage);
  const sections: { rank: Rank; people: string[] }[] = [
    { rank: "owner", people: groups.owner ?? [] },
    { rank: "mod", people: groups.mod ?? [] },
    { rank: "member", people: groups.member ?? [] },
  ];

  return (
    <aside className={styles.pane} aria-label={t("members.title")}>
      <header className={styles.head}>
        <span>{t("members.title")}</span>
        <span className={styles.count}>
          {people.length} {t("members.listed")}
        </span>
      </header>
      <p className={styles.hint}>{t("members.privacy")}</p>
      <div className={styles.list}>
        {sections.map((section) =>
          section.people.length === 0 ? null : (
            <div key={section.rank} className={styles.group}>
              <div className={styles.label}>
                {t(`members.${section.rank}`)} · {section.people.length}
              </div>
              {section.people.map((pubkey) => (
                <MemberRow
                  key={pubkey}
                  pubkey={pubkey}
                  me={me}
                  names={names}
                  pictures={pictures}
                  admins={admins}
                  muted={muted}
                  moderate={moderate}
                  stage={onStageSet.has(pubkey)}
                  onDm={onDm}
                  onMute={mutePubkey}
                  onKick={kick}
                  onOpen={() => setProfile(pubkey)}
                />
              ))}
            </div>
          ),
        )}
      </div>
      {profile ? (
        <ProfileCard
          pubkey={profile}
          onClose={() => setProfile(null)}
          onDm={
            onDm
              ? (pubkey) => {
                  onDm(pubkey);
                  setProfile(null);
                }
              : undefined
          }
        />
      ) : null}
    </aside>
  );
}

type RowProps = {
  pubkey: string;
  me: string | null;
  names: Record<string, string>;
  pictures: Record<string, string>;
  admins: GroupAdmin[];
  muted: string[];
  moderate: boolean;
  stage?: boolean;
  onDm?: (pubkey: string) => void;
  onMute: (pubkey: string) => Promise<void>;
  onKick: (pubkey: string) => Promise<void>;
  onOpen: () => void;
};

function MemberRow({ pubkey, me, names, pictures, admins, muted, moderate, stage, onDm, onMute, onKick, onOpen }: RowProps) {
  const { t } = useTranslation();
  const name = names[pubkey] || publicCallsign(pubkey);
  const rank = pubkey === me ? "you" : rankOf(admins, pubkey);
  return (
    <div className={styles.row} data-stage={stage ? "true" : "false"} data-rank={rank}>
      <button type="button" className={styles.face} onClick={onOpen}>
        <Avatar
          name={name}
          hue={hueFromPubkey(pubkey)}
          size={28}
          picture={pictures[pubkey] || (pubkey === me ? ownPicture : undefined)}
        />
      </button>
      <div className={styles.meta}>
        <button type="button" className={styles.name} onClick={onOpen}>
          {name}
        </button>
        <div className={styles.role}>{stage ? t("members.stage") : t(`members.${rank}`)}</div>
      </div>
      {pubkey !== me ? (
        <div className={styles.ops}>
          {onDm ? (
            <button type="button" title={t("rail.dms")} onClick={() => onDm(pubkey)}>
              <ChatCircle size={13} />
            </button>
          ) : null}
          <button
            type="button"
            title={t("mute.pubkey")}
            data-on={muted.includes(pubkey)}
            onClick={() => void onMute(pubkey)}
          >
            <SpeakerSlash size={13} />
          </button>
          {moderate ? (
            <button type="button" title={t("members.kick")} onClick={() => void onKick(pubkey)}>
              <UserMinus size={13} />
            </button>
          ) : null}
        </div>
      ) : (
        <span className={styles.signal} />
      )}
    </div>
  );
}
