import { Plus, Waveform } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { hueFromPubkey } from "../../lib/nostr/nip19.ts";
import { groupKey, type GroupRef } from "../../lib/nostr/nip29.ts";
import styles from "./ServerRail.module.css";

type Props = {
  groups: GroupRef[];
  activeKey: string | null;
  homeActive?: boolean;
  onHome: () => void;
  onSelect: (group: GroupRef) => void;
  onAdd: () => void;
};

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "AG";
}

export function ServerRail({ groups, activeKey, homeActive, onHome, onSelect, onAdd }: Props) {
  const { t } = useTranslation();

  return (
    <nav className={styles.rail} aria-label={t("rail.label")}>
      <button className={styles.home} type="button" data-active={homeActive} title={t("rail.dms")} onClick={onHome}>
        <Waveform size={22} weight="regular" />
      </button>
      <div className={styles.rule} />
      <div className={styles.list}>
        {groups.map((group) => (
          <button
            key={groupKey(group)}
            type="button"
            className={styles.server}
            data-active={!homeActive && groupKey(group) === activeKey}
            title={group.name}
            style={{ ["--hue" as string]: hueFromPubkey(group.id.padEnd(64, "0")) }}
            onClick={() => onSelect(group)}
          >
            <span className={styles.needle} />
            {shortName(group.name)}
          </button>
        ))}
      </div>
      <button className={styles.add} type="button" title={t("rail.add")} onClick={onAdd}>
        <Plus size={18} weight="bold" />
      </button>
    </nav>
  );
}
