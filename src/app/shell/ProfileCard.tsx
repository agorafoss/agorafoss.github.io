import { ChatCircle, SpeakerSlash, X } from "@phosphor-icons/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/auth-store.ts";
import { useGroupStore } from "../../features/groups/group-store.ts";
import { useMuteStore } from "../../features/mute/mute-store.ts";
import { useProfileStore } from "../../features/profile/profile-store.ts";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import { encodeNpub, hueFromPubkey, shortenNpub } from "../../lib/nostr/nip19.ts";
import { roleLabel } from "../../lib/nostr/permissions.ts";
import { Avatar } from "./Avatar.tsx";
import styles from "./ProfileCard.module.css";

type Props = {
  pubkey: string;
  onClose: () => void;
  onDm?: (pubkey: string) => void;
};

export function ProfileCard({ pubkey, onClose, onDm }: Props) {
  const { t } = useTranslation();
  const me = useAuthStore((state) => state.pubkey);
  const peeked = useProfileStore((state) => state.peeked);
  const busy = useProfileStore((state) => state.busy);
  const admins = useGroupStore((state) => state.admins);
  const mutePubkey = useMuteStore((state) => state.mutePubkey);
  const muted = useMuteStore((state) => state.list?.pubkeys) ?? [];
  const rank = pubkey === me ? "you" : roleLabel(admins.find((admin) => admin.pubkey === pubkey)?.roles ?? []);
  const profile = peeked?.profile ?? null;
  const name = profile?.displayName || profile?.name || publicCallsign(pubkey);
  let npub = pubkey;
  try {
    npub = encodeNpub(pubkey);
  } catch {
    npub = pubkey;
  }

  useEffect(() => {
    void useProfileStore.getState().lookup(pubkey);
    return () => useProfileStore.getState().clearPeek();
  }, [pubkey]);

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <article className={styles.card} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} title={t("settings.close")}>
          <X size={14} />
        </button>
        {profile?.picture ? (
          <img className={styles.photo} src={profile.picture} alt="" />
        ) : (
          <Avatar name={name} hue={hueFromPubkey(pubkey)} size={72} />
        )}
        <h2>{name}</h2>
        <p className={styles.call}>{publicCallsign(pubkey)}</p>
        <p className={styles.role}>{t(`members.${rank}`)}</p>
        <p className={styles.about}>{busy ? "…" : profile?.about || t("profile.emptyAbout")}</p>
        <p className={styles.npub}>{shortenNpub(npub)}</p>
        {pubkey !== me ? (
          <div className={styles.ops}>
            {onDm ? (
              <button type="button" onClick={() => onDm(pubkey)}>
                <ChatCircle size={14} />
                {t("rail.dms")}
              </button>
            ) : null}
            <button type="button" data-on={muted.includes(pubkey)} onClick={() => void mutePubkey(pubkey)}>
              <SpeakerSlash size={14} />
              {t("mute.pubkey")}
            </button>
          </div>
        ) : null}
      </article>
    </div>
  );
}
