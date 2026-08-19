// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  CornersIn,
  CornersOut,
  Microphone,
  MicrophoneSlash,
  Monitor,
  VideoCamera,
  VideoCameraSlash,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/auth-store.ts";
import { useChatStore } from "../../features/chat/chat-store.ts";
import { useProfileStore } from "../../features/profile/profile-store.ts";
import { useRelayStore } from "../../features/relays/relay-store.ts";
import { useTorStore } from "../../features/tor/tor-store.ts";
import { useVoiceStore } from "../../features/voice/voice-store.ts";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import { hueFromPubkey } from "../../lib/nostr/nip19.ts";
import { groupKey, type Channel } from "../../lib/nostr/nip29.ts";
import { Avatar } from "./Avatar.tsx";
import styles from "./ChatPane.module.css";
import { TitleBar } from "./TitleBar.tsx";
import { VuMeter } from "./VuMeter.tsx";
import voice from "./VoicePane.module.css";

type Props = {
  channel: Channel;
  onToggleMembers: () => void;
  onToggleChannels?: () => void;
  channelsOpen?: boolean;
  membersOpen?: boolean;
  onOpenSquare?: () => void;
};

function hasLiveVideo(stream: MediaStream | null): boolean {
  return Boolean(stream?.getVideoTracks().some((track) => track.readyState === "live"));
}

function Tile({
  stream,
  label,
  hue,
  picture,
  mute = false,
  level = 0,
}: {
  stream: MediaStream | null;
  label: string;
  hue: number;
  picture?: string;
  mute?: boolean;
  level?: number;
}) {
  const { t } = useTranslation();
  const boxRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [full, setFull] = useState(false);
  const video = hasLiveVideo(stream);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.srcObject = stream;
    return () => {
      node.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === boxRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function toggleFull() {
    const box = boxRef.current;
    if (!box) return;
    try {
      if (document.fullscreenElement === box) await document.exitFullscreen();
      else await box.requestFullscreen();
    } catch {
      /* browser blocked fullscreen */
    }
  }

  return (
    <figure ref={boxRef} className={voice.tile} data-video={video} data-talk={level > 0}>
      {video ? (
        <video ref={videoRef} autoPlay playsInline muted={mute} />
      ) : (
        <div className={voice.face}>
          <Avatar name={label} hue={hue} size={72} picture={picture} />
        </div>
      )}
      <figcaption>
        <span className={voice.who}>
          <VuMeter level={level} live={level > 0} size={14} />
          {label}
        </span>
        {video ? (
          <button type="button" className={voice.fs} title={t(full ? "voice.exitFull" : "voice.full")} onClick={() => void toggleFull()}>
            {full ? <CornersIn size={16} /> : <CornersOut size={16} />}
          </button>
        ) : null}
      </figcaption>
    </figure>
  );
}

export function VoicePane({
  channel,
  onToggleMembers,
  onToggleChannels,
  channelsOpen,
  membersOpen,
  onOpenSquare,
}: Props) {
  const { t } = useTranslation();
  const connected = useRelayStore((state) => state.live.filter((relay) => relay.status === "connected").length);
  const status = useVoiceStore((state) => state.status);
  const muted = useVoiceStore((state) => state.muted);
  const camera = useVoiceStore((state) => state.camera);
  const screen = useVoiceStore((state) => state.screen);
  const error = useVoiceStore((state) => state.error);
  const peers = useVoiceStore((state) => state.peers);
  const localVideo = useVoiceStore((state) => state.localVideo);
  const talking = useVoiceStore((state) => state.talking);
  const join = useVoiceStore((state) => state.join);
  const leave = useVoiceStore((state) => state.leave);
  const toggleMute = useVoiceStore((state) => state.toggleMute);
  const toggleCamera = useVoiceStore((state) => state.toggleCamera);
  const toggleScreen = useVoiceStore((state) => state.toggleScreen);
  const circuit = useTorStore((state) => state.enabled);
  const names = useChatStore((state) => state.names);
  const pubkey = useAuthStore((state) => state.pubkey);
  const callsign = useAuthStore((state) => state.callsign);
  const profile = useProfileStore((state) => state.own);
  const [door, setDoor] = useState("");
  const roomId = groupKey(channel);

  useEffect(() => {
    void join(channel);
    return () => {
      void leave();
    };
    // entra de novo só se mudar a sala, não se o objeto Channel for recriado no fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, join, leave]);

  const selfName = profile.displayName || profile.name || callsign || t("voice.you");
  const tiles = status === "live" ? peers.length + 1 : 0;

  return (
    <section className={styles.pane}>
      <TitleBar
        name={channel.name}
        topic={t("voice.hint")}
        relayCount={connected}
        kind="voice"
        live={status === "live"}
        circuit={circuit ? "tor" : "clearnet"}
        onToggleMembers={onToggleMembers}
        onToggleChannels={onToggleChannels}
        channelsOpen={channelsOpen}
        membersOpen={membersOpen}
        onOpenSquare={onOpenSquare}
      />
      <div className={voice.stage}>
        <div className={voice.banner}>
          <p className={voice.status}>{t(`voice.status.${status}`)}</p>
          {error ? <p className={styles.error}>{t(`voice.errors.${error}`)}</p> : null}
          {channel.locked && status !== "live" ? (
            <form
              className={voice.door}
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                if (!door.trim()) return;
                void join(channel, door);
              }}
            >
              <p className={voice.notice}>{t("voice.passwordLead")}</p>
              <input
                type="password"
                value={door}
                onChange={(event) => setDoor(event.target.value)}
                placeholder={t("voice.password")}
                autoComplete="off"
              />
              <button type="submit" disabled={!door.trim()}>
                {t("voice.unlock")}
              </button>
            </form>
          ) : null}
          <p className={voice.warn}>{t("voice.ipWarn")}</p>
          <p className={voice.notice}>{t("voice.qualityWarn")}</p>
          {circuit ? <p className={voice.warn}>{t("voice.noTor")}</p> : null}
        </div>
        {status === "live" ? (
          <div className={voice.grid} data-count={tiles > 4 ? "many" : String(tiles)}>
            <Tile
              stream={localVideo}
              label={selfName}
              hue={hueFromPubkey(pubkey ?? "")}
              picture={profile.picture}
              mute
              level={talking.self ?? 0}
            />
            {peers.map((peer) => {
              const name = peer.pubkey ? names[peer.pubkey] || publicCallsign(peer.pubkey) : peer.peerId.slice(0, 8);
              return (
                <Tile
                  key={peer.peerId}
                  stream={peer.stream}
                  label={name}
                  hue={hueFromPubkey(peer.pubkey)}
                  level={talking[peer.peerId] ?? 0}
                />
              );
            })}
          </div>
        ) : null}
        <div className={voice.controls}>
          <button type="button" onClick={() => void toggleMute()} data-off={muted} disabled={status !== "live"}>
            {muted ? <MicrophoneSlash size={18} /> : <Microphone size={18} />}
            {t(muted ? "voice.unmute" : "voice.mute")}
          </button>
          <button type="button" onClick={() => void toggleCamera()} data-off={!camera} disabled={status !== "live"}>
            {camera ? <VideoCamera size={18} /> : <VideoCameraSlash size={18} />}
            {t(camera ? "voice.camOff" : "voice.camOn")}
          </button>
          <button type="button" onClick={() => void toggleScreen()} data-off={!screen} disabled={status !== "live"}>
            <Monitor size={18} />
            {t(screen ? "voice.screenOff" : "voice.screenOn")}
          </button>
        </div>
      </div>
    </section>
  );
}
