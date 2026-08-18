import { Copy, Hash, List, SpeakerHigh, Users } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import styles from "./TitleBar.module.css";
import { VuMeter } from "./VuMeter.tsx";

type Props = {
  name: string;
  topic?: string;
  relayCount: number;
  kind?: "text" | "voice";
  live?: boolean;
  circuit?: "clearnet" | "tor";
  onToggleMembers: () => void;
  onToggleChannels?: () => void;
  channelsOpen?: boolean;
  membersOpen?: boolean;
  onCopyInvite?: () => void;
  copied?: boolean;
};

export function TitleBar(props: Props) {
  const { t } = useTranslation();
  const Icon = props.kind === "voice" ? SpeakerHigh : Hash;
  const channelsOpen = props.channelsOpen !== false;
  const membersOpen = props.membersOpen !== false;

  return (
    <header className={styles.bar}>
      <Icon className={styles.hash} size={18} />
      <span className={styles.name}>{props.name || "#"}</span>
      {props.live ? <span className={styles.live}>{t("status.live")}</span> : null}
      {props.topic ? <p className={styles.topic}>{props.topic}</p> : <span className={styles.topic} />}
      <div className={styles.meta}>
        <VuMeter level={Math.min(4, Math.max(1, props.relayCount))} live={props.relayCount > 0} />
        <span>{t("user.relays", { count: props.relayCount })}</span>
        <span>{props.circuit === "tor" ? t("status.circuitOpen") : t("status.clearnet")}</span>
      </div>
      {props.onCopyInvite ? (
        <button type="button" className={styles.invite} onClick={props.onCopyInvite} title={t("groups.copyInvite")}>
          <Copy size={14} />
          <span>{props.copied ? t("groups.copied") : t("groups.copyInvite")}</span>
        </button>
      ) : null}
      <div className={styles.toggles}>
        {props.onToggleChannels ? (
          <button
            type="button"
            className={styles.iconBtn}
            data-on={channelsOpen ? "true" : "false"}
            onClick={props.onToggleChannels}
            title={t(channelsOpen ? "layout.hideChannels" : "layout.showChannels")}
          >
            <List size={18} />
          </button>
        ) : null}
        <button
          type="button"
          className={styles.iconBtn}
          data-on={membersOpen ? "true" : "false"}
          onClick={props.onToggleMembers}
          title={t(membersOpen ? "layout.hideMembers" : "layout.showMembers")}
        >
          <Users size={18} />
        </button>
      </div>
    </header>
  );
}
