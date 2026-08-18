import { Microphone, MicrophoneSlash, VideoCamera, VideoCameraSlash } from "@phosphor-icons/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRelayStore } from "../../features/relays/relay-store.ts";
import { useTorStore } from "../../features/tor/tor-store.ts";
import { useChatStore } from "../../features/chat/chat-store.ts";
import { useGroupStore } from "../../features/groups/group-store.ts";
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
};

export function VoicePane({ channel, onToggleMembers, onToggleChannels, channelsOpen, membersOpen }: Props) {
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

  useEffect(() => {
    void join(channel);
    return () => {
      void leave();
    };
  }, [channel, join, leave]);

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
      />
      <div className={voice.stage}>
        <p className={voice.status}>{t(`voice.status.${status}`)}</p>
        {error ? <p className={styles.error}>{t(`voice.errors.${error}`)}</p> : null}
        {circuit ? <p className={voice.warn}>{t("voice.noTor")}</p> : null}
        {onStage.length > 0 ? (
          <ul className={voice.people}>
            {onStage.map((pubkey) => (
              <li key={pubkey}>{names[pubkey] || publicCallsign(pubkey)}</li>
            ))}
          </ul>
        ) : null}
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
      </div>
    </section>
  );
}
