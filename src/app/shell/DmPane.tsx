// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PaperPlaneTilt } from "@phosphor-icons/react";
import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/auth-store.ts";
import { useDmStore } from "../../features/dms/dm-store.ts";
import { useProfileStore } from "../../features/profile/profile-store.ts";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import { decodeNpub, hueFromPubkey } from "../../lib/nostr/nip19.ts";
import { renderMarkdown } from "../../lib/nostr/markdown.ts";
import { Avatar } from "./Avatar.tsx";
import styles from "./ChatPane.module.css";
import list from "./ChannelList.module.css";

export function DmPane() {
  const { t } = useTranslation();
  const me = useAuthStore((state) => state.pubkey);
  const messages = useDmStore((state) => state.messages);
  const names = useDmStore((state) => state.names);
  const pictures = useDmStore((state) => state.pictures);
  const ownPicture = useProfileStore((state) => state.own.picture);
  const activePeer = useDmStore((state) => state.activePeer);
  const select = useDmStore((state) => state.select);
  const send = useDmStore((state) => state.send);
  const error = useDmStore((state) => state.error);
  const [draft, setDraft] = useState("");
  const [lookup, setLookup] = useState("");

  const peers = useMemo(() => {
    const ids = new Set(messages.map((message) => message.peer));
    if (activePeer) ids.add(activePeer);
    return [...ids];
  }, [messages, activePeer]);

  const thread = messages.filter((message) => message.peer === activePeer);

  function startPeer() {
    const raw = lookup.trim();
    if (!raw) return;
    try {
      select(raw.startsWith("npub1") ? decodeNpub(raw) : raw.toLowerCase());
      setLookup("");
    } catch {
      /* invalid npub stays in the field so the user can fix it */
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!activePeer) return;
    void send(activePeer, draft);
    setDraft("");
  }

  return (
    <>
      <section className={list.pane} aria-label={t("rail.dms")}>
        <header className={list.station}>
          <span className={list.callsign}>{t("app.name")}</span>
          <h1 className={list.name}>{t("dms.title")}</h1>
          <span className={list.relay}>{t("dms.lead")}</span>
        </header>
        <div className={list.list}>
          <form
            className={list.category}
            onSubmit={(event) => {
              event.preventDefault();
              startPeer();
            }}
          >
            <input
              value={lookup}
              onChange={(event) => setLookup(event.target.value)}
              placeholder={t("dms.lookup")}
              spellCheck={false}
            />
          </form>
          {peers.map((peer) => (
            <button
              key={peer}
              type="button"
              className={list.channel}
              data-active={peer === activePeer}
              onClick={() => select(peer)}
            >
              <Avatar name={names[peer] || publicCallsign(peer)} hue={hueFromPubkey(peer)} size={20} picture={pictures[peer]} />
              <span className={list.label}>{names[peer] || publicCallsign(peer)}</span>
            </button>
          ))}
        </div>
      </section>
      <section className={styles.pane}>
        <div className={styles.feed}>
          {!activePeer ? (
            <div className={styles.empty}>
              <h2>{t("dms.emptyTitle")}</h2>
              <p>{t("dms.emptyBody")}</p>
            </div>
          ) : thread.length === 0 ? (
            <div className={styles.empty}>
              <h2>{names[activePeer] || publicCallsign(activePeer)}</h2>
              <p>{t("dms.threadEmpty")}</p>
            </div>
          ) : (
            thread.map((message) => {
              const author = message.outgoing
                ? t("members.you")
                : names[message.pubkey] || publicCallsign(message.pubkey);
              return (
                <article key={message.wrapId} className={styles.message}>
                  <Avatar
                    name={author}
                    hue={hueFromPubkey(message.outgoing ? (me ?? "") : message.pubkey)}
                    size={36}
                    picture={message.outgoing ? ownPicture : pictures[message.pubkey]}
                  />
                  <div className={styles.body}>
                    <div className={styles.head}>
                      <span className={styles.author}>{author}</span>
                    </div>
                    <p className={styles.text} dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
                  </div>
                </article>
              );
            })
          )}
        </div>
        <form className={styles.composerWrap} onSubmit={handleSubmit}>
          {error ? <p className={styles.error}>{t(`dms.errors.${error}`)}</p> : null}
          <div className={styles.composer}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("dms.placeholder")}
              disabled={!activePeer}
            />
            <button type="submit" className={styles.send} disabled={!activePeer || !draft.trim()} title={t("chat.send")}>
              <PaperPlaneTilt size={16} weight="fill" />
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
