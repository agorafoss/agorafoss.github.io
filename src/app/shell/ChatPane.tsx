// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ArrowBendUpLeft, Broadcast, Paperclip, PaperPlaneTilt, PushPin, Smiley, Trash } from "@phosphor-icons/react";
import { memo, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/auth-store.ts";
import { useChatStore, type ChatMessage } from "../../features/chat/chat-store.ts";
import { useGroupStore } from "../../features/groups/group-store.ts";
import { useProfileStore } from "../../features/profile/profile-store.ts";
import { useLiveStore } from "../../features/live/live-store.ts";
import { useRelayStore } from "../../features/relays/relay-store.ts";
import { useTorStore } from "../../features/tor/tor-store.ts";
import { encodeGroupInvite } from "../../lib/nostr/invite.ts";
import { playbackKind, startWhep } from "../../lib/nostr/whip.ts";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import { hueFromPubkey } from "../../lib/nostr/nip19.ts";
import { renderMarkdown } from "../../lib/nostr/markdown.ts";
import type { Channel } from "../../lib/nostr/nip29.ts";
import { openMojiUrl } from "../../lib/nostr/openmoji.ts";
import { Avatar } from "./Avatar.tsx";
import { EmojiPicker } from "./EmojiPicker.tsx";
import { ProfileCard } from "./ProfileCard.tsx";
import styles from "./ChatPane.module.css";
import { TitleBar } from "./TitleBar.tsx";

type Props = {
  channel: Channel | null;
  onToggleMembers: () => void;
  onToggleChannels?: () => void;
  channelsOpen?: boolean;
  membersOpen?: boolean;
  onDm?: (pubkey: string) => void;
  onOpenSquare?: () => void;
};

export function ChatPane({ channel, onToggleMembers, onToggleChannels, channelsOpen, membersOpen, onDm, onOpenSquare }: Props) {
  const [profile, setProfile] = useState<string | null>(null);

  return (
    <section className={styles.pane}>
      <ChatHeader
        channel={channel}
        onToggleMembers={onToggleMembers}
        onToggleChannels={onToggleChannels}
        channelsOpen={channelsOpen}
        membersOpen={membersOpen}
        onOpenSquare={onOpenSquare}
      />
      <ChatFeed channel={channel} onProfile={setProfile} />
      <ChatComposer channel={channel} />
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
    </section>
  );
}

function ChatHeader({
  channel,
  onToggleMembers,
  onToggleChannels,
  channelsOpen,
  membersOpen,
  onOpenSquare,
}: {
  channel: Channel | null;
  onToggleMembers: () => void;
  onToggleChannels?: () => void;
  channelsOpen?: boolean;
  membersOpen?: boolean;
  onOpenSquare?: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const praça = useGroupStore((state) => state.active());
  const connected = useRelayStore((state) => state.live.filter((relay) => relay.status === "connected").length);
  const live = useLiveStore((state) => state.current);
  const circuit = useTorStore((state) => state.enabled && state.health === "ready");

  return (
    <>
      <TitleBar
        name={channel ? (channel.parent ? channel.name : "geral") : "#"}
        topic={channel ? `${channel.about || channel.name} · ${channel.id}` : t("empty.serverBody")}
        relayCount={connected}
        kind={channel?.kind}
        live={Boolean(live)}
        circuit={circuit ? "tor" : "clearnet"}
        onToggleMembers={onToggleMembers}
        onToggleChannels={onToggleChannels}
        channelsOpen={channelsOpen}
        membersOpen={membersOpen}
        copied={copied}
        onOpenSquare={onOpenSquare}
        onCopyInvite={
          praça
            ? () => {
                void encodeGroupInvite(praça).then((text) => {
                  void navigator.clipboard.writeText(text);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                });
              }
            : undefined
        }
      />
      {channel && live ? (
        <>
          <div className={styles.liveBar}>
            <Broadcast size={14} />
            <span>{live.title || t("live.on")}</span>
            <a href={live.streaming} target="_blank" rel="noreferrer">
              {t("live.watch")}
            </a>
          </div>
          <LivePlayer url={live.streaming} />
        </>
      ) : null}
    </>
  );
}

function LivePlayer({ url }: { url: string }) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const kind = playbackKind(url);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setFailed(false);
    if (kind === "hls") {
      video.src = url;
      void video.play().catch(() => setFailed(true));
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }
    if (kind !== "whep") return;
    let pc: RTCPeerConnection | null = null;
    let cancelled = false;
    void startWhep(url, video)
      .then((peer) => {
        if (cancelled) {
          peer.close();
          return;
        }
        pc = peer;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      pc?.close();
      video.srcObject = null;
    };
  }, [url, kind]);

  if (kind === "url" || failed) return null;

  return (
    <div className={styles.liveStage}>
      <video ref={videoRef} autoPlay playsInline controls muted={false} aria-label={t("live.on")} />
    </div>
  );
}

const EMPTY_REACTS: Record<string, string[]> = {};

function ChatFeed({ channel, onProfile }: { channel: Channel | null; onProfile: (pubkey: string) => void }) {
  const { t } = useTranslation();
  const feedRef = useRef<HTMLDivElement>(null);
  const messages = useChatStore((state) => state.messages);
  const reactions = useChatStore((state) => state.reactions);
  const names = useChatStore((state) => state.names);
  const pictures = useChatStore((state) => state.pictures);
  const me = useAuthStore((state) => state.pubkey);
  const ownPicture = useProfileStore((state) => state.own.picture);
  const pins = useGroupStore((state) => state.pins);
  const pin = useGroupStore((state) => state.pin);
  const unpin = useGroupStore((state) => state.unpin);
  const moderate = useGroupStore((state) => state.canModerate());
  const setReply = useChatStore((state) => state.setReply);
  const react = useChatStore((state) => state.react);
  const remove = useChatStore((state) => state.remove);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [messages.length]);

  const byId = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const pinned = pins.map((id) => byId.get(id)).filter(Boolean);

  return (
    <>
      {pinned.length > 0 ? (
        <div className={styles.pins}>
          {pinned.map((message) =>
            message ? (
              <button key={message.id} type="button" className={styles.pin} onClick={() => unpin(message.id)}>
                <PushPin size={12} />
                {message.content}
              </button>
            ) : null,
          )}
        </div>
      ) : null}
      <div className={styles.feed} ref={feedRef}>
        {!channel ? (
          <div className={styles.empty}>
            <h2>{t("empty.serverTitle")}</h2>
            <p>{t("empty.serverBody")}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>
            <h2>{t("chat.emptyTitle")}</h2>
            <p>{t("chat.emptyBody")}</p>
          </div>
        ) : (
          <>
            <div className={styles.day}>{t("chat.today")}</div>
            {messages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                author={names[message.pubkey] || publicCallsign(message.pubkey)}
                picture={pictures[message.pubkey] || (message.pubkey === me ? ownPicture : undefined)}
                parent={message.replyTo ? byId.get(message.replyTo) : undefined}
                parentName={
                  message.replyTo
                    ? names[byId.get(message.replyTo)?.pubkey ?? ""] ||
                      publicCallsign(byId.get(message.replyTo)?.pubkey ?? "")
                    : ""
                }
                reacts={reactions[message.id] ?? EMPTY_REACTS}
                pinned={pins.includes(message.id)}
                moderate={moderate}
                channel={channel}
                onProfile={onProfile}
                onReply={setReply}
                onReact={react}
                onPin={pin}
                onUnpin={unpin}
                onRemove={remove}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}

const MessageHtml = memo(function MessageHtml({ html }: { html: string }) {
  return <p className={styles.text} dangerouslySetInnerHTML={{ __html: html }} />;
});

const MessageRow = memo(function MessageRow({
  message,
  author,
  picture,
  parent,
  parentName,
  reacts,
  pinned,
  moderate,
  channel,
  onProfile,
  onReply,
  onReact,
  onPin,
  onUnpin,
  onRemove,
}: {
  message: ChatMessage;
  author: string;
  picture?: string;
  parent?: ChatMessage;
  parentName: string;
  reacts: Record<string, string[]>;
  pinned: boolean;
  moderate: boolean;
  channel: Channel;
  onProfile: (pubkey: string) => void;
  onReply: (message: ChatMessage) => void;
  onReact: (group: Channel, eventId: string, emoji: string) => Promise<void>;
  onPin: (id: string) => Promise<void>;
  onUnpin: (id: string) => Promise<void>;
  onRemove: (group: Channel, eventId: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [reactOpen, setReactOpen] = useState(false);
  const html = useMemo(() => renderMarkdown(message.content), [message.content]);
  const reactCount = Object.values(reacts).reduce((sum, people) => sum + (people?.length ?? 0), 0);

  return (
    <article className={styles.message}>
      <button type="button" className={styles.avatarBtn} onClick={() => onProfile(message.pubkey)}>
        <Avatar name={author} hue={hueFromPubkey(message.pubkey)} size={36} picture={picture} />
      </button>
      <div className={styles.body}>
        <div className={styles.head}>
          <button type="button" className={styles.author} onClick={() => onProfile(message.pubkey)}>
            {author}
          </button>
          <time className={styles.time}>{formatTime(message.createdAt)}</time>
        </div>
        {parent ? (
          <p className={styles.replyLine}>
            {t("chat.replyTo")} {parentName}: {parent.content}
          </p>
        ) : null}
        <MessageHtml html={html} />
        {reactCount > 0 ? (
          <div className={styles.chips}>
            {Object.entries(reacts).map(([emoji, people]) =>
              people?.length ? (
                <span key={emoji} className={styles.chip} title={emoji}>
                  <img src={openMojiUrl(emoji)} width={14} height={14} alt={emoji} />
                  {people.length}
                </span>
              ) : null,
            )}
          </div>
        ) : null}
        <div className={styles.actions} data-open={reactOpen}>
          <button type="button" onClick={() => onReply(message)} title={t("chat.reply")}>
            <ArrowBendUpLeft size={14} />
          </button>
          <button type="button" onClick={() => setReactOpen((open) => !open)} title={t("chat.emoji")}>
            <img src={openMojiUrl("🙂")} width={14} height={14} alt="" />
          </button>
          {reactOpen ? (
            <div className={styles.reactDock}>
              <EmojiPicker
                onPick={(emoji) => {
                  void onReact(channel, message.id, emoji);
                  setReactOpen(false);
                }}
              />
            </div>
          ) : null}
          {moderate ? (
            <>
              <button
                type="button"
                onClick={() => void (pinned ? onUnpin(message.id) : onPin(message.id))}
                title={t("chat.pins")}
              >
                <PushPin size={14} />
              </button>
              <button type="button" onClick={() => void onRemove(channel, message.id)} title={t("chat.delete")}>
                <Trash size={14} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
});

function ChatComposer({ channel }: { channel: Channel | null }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const names = useChatStore((state) => state.names);
  const replyTo = useChatStore((state) => state.replyTo);
  const send = useChatStore((state) => state.send);
  const attach = useChatStore((state) => state.attach);
  const setReply = useChatStore((state) => state.setReply);
  const error = useChatStore((state) => state.error);
  const publishing = useLiveStore((state) => state.publishing);
  const startLive = useLiveStore((state) => state.start);
  const stopLive = useLiveStore((state) => state.stop);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!channel) return;
    void send(channel, draft);
    setDraft("");
  }

  return (
    <form className={styles.composerWrap} onSubmit={handleSubmit}>
      {replyTo ? (
        <div className={styles.replyBar}>
          <span>
            {t("chat.replying")} {names[replyTo.pubkey] || publicCallsign(replyTo.pubkey)}
          </span>
          <button type="button" onClick={() => setReply(null)}>
            {t("chat.cancelReply")}
          </button>
        </div>
      ) : null}
      {error ? <p className={styles.error}>{t(`chat.errors.${error}`)}</p> : null}
      <div className={styles.composer}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("chat.placeholder", { channel: channel ? `#${channel.parent ? channel.name : "geral"}` : "" })}
          disabled={!channel}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file && channel) void attach(channel, file);
          }}
        />
        <button type="button" className={styles.ghost} disabled={!channel} title={t("chat.emoji")} onClick={() => setEmojiOpen((open) => !open)}>
          <Smiley size={16} />
        </button>
        <button type="button" className={styles.ghost} disabled={!channel} title={t("chat.attach")} onClick={() => fileRef.current?.click()}>
          <Paperclip size={16} />
        </button>
        {channel ? (
          <button
            type="button"
            className={styles.ghost}
            title={t("live.go")}
            onClick={() => {
              if (publishing) {
                void stopLive(channel);
                return;
              }
              if (!window.confirm(t("live.ipWarn"))) return;
              void startLive(channel, channel.name);
            }}
          >
            <Broadcast size={16} />
          </button>
        ) : null}
        <button type="submit" className={styles.send} disabled={!channel || !draft.trim()} title={t("chat.send")}>
          <PaperPlaneTilt size={16} weight="fill" />
        </button>
      </div>
      {emojiOpen ? (
        <div className={styles.emojiDock}>
          <EmojiPicker
            onPick={(emoji) => {
              setDraft((value) => `${value}${emoji}`);
              setEmojiOpen(false);
            }}
          />
        </div>
      ) : null}
    </form>
  );
}

function formatTime(unix: number): string {
  if (!unix) return "";
  return new Date(unix * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
