// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./FlowMap.module.css";

const NODES = [
  "you",
  "split",
  "site",
  "desktop",
  "relay",
  "blossom",
  "livekit",
  "mediamtx",
  "lan",
  "peer",
  "tor",
] as const;

type NodeId = (typeof NODES)[number];
type Kind = "start" | "box" | "split" | "end" | "ghost";

const KIND: Record<NodeId, Kind> = {
  you: "start",
  split: "split",
  site: "box",
  desktop: "box",
  relay: "box",
  blossom: "box",
  livekit: "box",
  mediamtx: "box",
  lan: "box",
  peer: "end",
  tor: "ghost",
};

function Node({
  id,
  open,
  onOpen,
}: {
  id: NodeId;
  open: NodeId;
  onOpen: (id: NodeId) => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={styles.node}
      data-id={id}
      data-kind={KIND[id]}
      data-on={open === id}
      aria-expanded={open === id}
      aria-controls="flow-detail"
      onClick={() => onOpen(id)}
    >
      <span>{t(`landing.flow.${id}.label`)}</span>
    </button>
  );
}

export function FlowMap() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<NodeId>("you");

  return (
    <section className={styles.wrap} data-block aria-label={t("landing.flowTitle")}>
      <div className={styles.head}>
        <h2 className={styles.heading}>{t("landing.flowTitle")}</h2>
        <p className={styles.hint}>{t("landing.flowHint")}</p>
      </div>

      <div className={styles.canvas}>
        <div className={styles.cell} data-area="you" data-out="right">
          <Node id="you" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="split" data-out="fork">
          <Node id="split" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="site" data-out="right">
          <Node id="site" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="relay" data-out="right">
          <Node id="relay" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="blossom" data-out="right">
          <Node id="blossom" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="peer">
          <Node id="peer" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="desk" data-out="right">
          <Node id="desktop" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="live" data-out="branch">
          <Node id="livekit" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="lan" data-out="right">
          <Node id="lan" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="mtx">
          <Node id="mediamtx" open={open} onOpen={setOpen} />
        </div>
        <div className={styles.cell} data-area="tor">
          <Node id="tor" open={open} onOpen={setOpen} />
        </div>
      </div>

      <aside id="flow-detail" className={styles.detail} aria-live="polite">
        <h3>{t(`landing.flow.${open}.label`)}</h3>
        <p>{t(`landing.flow.${open}.body`)}</p>
      </aside>
    </section>
  );
}
