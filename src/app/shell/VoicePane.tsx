// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Microphone, MicrophoneSlash, VideoCamera, VideoCameraSlash } from "@phosphor-icons/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRelayStore } from "../../features/relays/relay-store.ts";
import { useTorStore } from "../../features/tor/tor-store.ts";
import { useChatStore } from "../../features/chat/chat-store.ts";
import { useGroupStore } from "../../features/groups/group-store.ts";
import { useDesktopStore } from "../../features/desktop/desktop-store.ts";
import { useVoiceStore } from "../../features/voice/voice-store.ts";
import { publicCallsign } from "../../lib/nostr/callsign.ts";
import type { Channel } from "../../lib/nostr/nip29.ts";
import styles from "./ChatPane.module.css";
import { TitleBar } from "./TitleBar.tsx";
import voice from "./VoicePane.module.css";

type Props = {
  channel: Channel;
  onToggleMembers: () => void;
  onToggleChannels?: () => void;
  channelsOpen?: boolean;
  membersOpen?: boolean;
  onOpenSquare?: () => void;
};

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
  const error = useVoiceStore((state) => state.error);
  const join = useVoiceStore((state) => state.join);
  const leave = useVoiceStore((state) => state.leave);
  const toggleMute = useVoiceStore((state) => state.toggleMute);
  const toggleCamera = useVoiceStore((state) => state.toggleCamera);
  const circuit = useTorStore((state) => state.enabled);
  const onStage = useGroupStore((state) => state.onStage);
  const names = useChatStore((state) => state.names);
  const desktop = useDesktopStore((state) => state.desktop);

  useEffect(() => {
    if (!desktop) return;
    void join(channel);
    return () => {
      void leave();
    };
  }, [channel, desktop, join, leave]);

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
        {desktop ? (
          <>
            <p className={voice.status}>{t(`voice.status.${status}`)}</p>
            {error ? <p className={styles.error}>{t(`voice.errors.${error}`)}</p> : null}
            <p className={voice.warn}>{t("voice.ipWarn")}</p>
            {circuit ? <p className={voice.warn}>{t("voice.noTor")}</p> : null}
          </>
        ) : (
          <>
            <p className={voice.status}>{t("desktop.webStageTitle")}</p>
            <p className={voice.notice}>{t("desktop.webStageBody")}</p>
            <a className={voice.doc} href="https://github.com/agorafoss/agora-desktop" target="_blank" rel="noreferrer">
              {t("desktop.getApp")}
            </a>
          </>
        )}
        {desktop && onStage.length > 0 ? (
          <ul className={voice.people}>
            {onStage.map((pubkey) => (
              <li key={pubkey}>{names[pubkey] || publicCallsign(pubkey)}</li>
            ))}
          </ul>
        ) : null}
        {desktop ? (
          <div className={voice.controls}>
            <button type="button" onClick={toggleMute} data-off={muted}>
              {muted ? <MicrophoneSlash size={18} /> : <Microphone size={18} />}
              {t(muted ? "voice.unmute" : "voice.mute")}
            </button>
            <button type="button" onClick={() => void toggleCamera()} data-off={!camera}>
              {camera ? <VideoCamera size={18} /> : <VideoCameraSlash size={18} />}
              {t(camera ? "voice.camOff" : "voice.camOn")}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
