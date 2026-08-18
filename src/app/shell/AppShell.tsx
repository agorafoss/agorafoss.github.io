import { List } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useChatStore } from "../../features/chat/chat-store.ts";
import { useDmStore } from "../../features/dms/dm-store.ts";
import { ChannelModal } from "../../features/groups/ChannelModal.tsx";
import { PraçaModal } from "../../features/groups/PraçaModal.tsx";
import { useGroupStore } from "../../features/groups/group-store.ts";
import { useLiveStore } from "../../features/live/live-store.ts";
import { useMuteStore } from "../../features/mute/mute-store.ts";
import { PraçaSettings } from "../../features/groups/PraçaSettings.tsx";
import { SettingsDrawer } from "../../features/settings/SettingsDrawer.tsx";
import { useTorStore } from "../../features/tor/tor-store.ts";
import { takeStashedInvite } from "../../lib/nostr/invite.ts";
import { groupKey } from "../../lib/nostr/nip29.ts";
import { ChannelList } from "./ChannelList.tsx";
import { ChatPane } from "./ChatPane.tsx";
import { DmPane } from "./DmPane.tsx";
import { MemberList } from "./MemberList.tsx";
import { ServerRail } from "./ServerRail.tsx";
import { VoicePane } from "./VoicePane.tsx";
import styles from "./AppShell.module.css";

type View = "square" | "dms";

export function AppShell() {
  const [membersOpen, setMembersOpen] = useState(() => window.innerWidth >= 1280);
  const [channelsOpen, setChannelsOpen] = useState(() => window.innerWidth >= 1100);
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [squareOpen, setSquareOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [view, setView] = useState<View>("square");
  const groups = useGroupStore((state) => state.groups);
  const activeKey = useGroupStore((state) => state.activeKey);
  const channels = useGroupStore((state) => state.channels);
  const activeChannelKey = useGroupStore((state) => state.activeChannelKey);
  const members = useGroupStore((state) => state.members);
  const load = useGroupStore((state) => state.load);
  const join = useGroupStore((state) => state.join);
  const select = useGroupStore((state) => state.select);
  const unwatchStage = useGroupStore((state) => state.unwatchStage);
  const openChat = useChatStore((state) => state.open);
  const closeChat = useChatStore((state) => state.close);
  const openDms = useDmStore((state) => state.open);
  const closeDms = useDmStore((state) => state.close);
  const selectPeer = useDmStore((state) => state.select);
  const openLive = useLiveStore((state) => state.open);
  const closeLive = useLiveStore((state) => state.close);
  const live = useLiveStore((state) => state.current);
  const loadMute = useMuteStore((state) => state.load);
  const loadTor = useTorStore((state) => state.load);
  const group = groups.find((item) => groupKey(item) === activeKey) ?? null;
  const channel = channels.find((item) => groupKey(item) === activeChannelKey) ?? null;

  useEffect(() => {
    void load().then(() => {
      const pending = takeStashedInvite();
      if (pending) void join(pending);
    });
    void loadMute();
    void loadTor();
    openDms();
    return () => {
      closeChat();
      closeDms();
      closeLive();
      unwatchStage();
    };
    // monta uma vez: se as actions entrarem nas deps, o StrictMode/HMR zera o chat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view !== "square") return;
    if (channel?.kind === "text") {
      openChat(channel);
      if (group) openLive(group);
    } else {
      closeChat();
    }
  }, [view, activeChannelKey, channel?.kind, channel?.id, channel?.relay, group?.id, group?.relay, openChat, closeChat, openLive]);

  return (
    <div
      className={styles.shell}
      data-members={membersOpen ? "true" : "false"}
      data-channels={channelsOpen ? "true" : "false"}
      data-nav={navOpen ? "true" : "false"}
      data-dms={view === "dms" ? "true" : "false"}
    >
      <ServerRail
        groups={groups}
        activeKey={activeKey}
        homeActive={view === "dms"}
        onHome={() => setView("dms")}
        onSelect={(next) => {
          setView("square");
          void select(next);
        }}
        onAdd={() => setCreateOpen(true)}
      />
      {view === "dms" ? (
        <DmPane />
      ) : (
        <>
          <div className={styles.channels}>
            <ChannelList
              group={group}
              channel={channel}
              live={Boolean(live)}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenSquare={() => setSquareOpen(true)}
              onAddChannel={() => setChannelOpen(true)}
            />
          </div>
          {channel?.kind === "voice" ? (
            <VoicePane
              channel={channel}
              onToggleMembers={() => setMembersOpen((open) => !open)}
              onToggleChannels={() => setChannelsOpen((open) => !open)}
              channelsOpen={channelsOpen}
              membersOpen={membersOpen}
            />
          ) : (
            <ChatPane
              channel={channel}
              onToggleMembers={() => setMembersOpen((open) => !open)}
              onToggleChannels={() => setChannelsOpen((open) => !open)}
              channelsOpen={channelsOpen}
              membersOpen={membersOpen}
              onDm={(pubkey) => {
                selectPeer(pubkey);
                setView("dms");
              }}
            />
          )}
        </>
      )}
      {view === "square" ? (
        <div className={styles.members} hidden={!membersOpen}>
          <MemberList
            members={members}
            onDm={(pubkey) => {
              selectPeer(pubkey);
              setView("dms");
            }}
          />
        </div>
      ) : null}
      <button type="button" className={styles.drawerBtn} onClick={() => setNavOpen((open) => !open)}>
        <List size={18} />
      </button>
      {settingsOpen ? <SettingsDrawer onClose={() => setSettingsOpen(false)} /> : null}
      {squareOpen ? <PraçaSettings onClose={() => setSquareOpen(false)} /> : null}
      {createOpen ? <PraçaModal onClose={() => setCreateOpen(false)} /> : null}
      {channelOpen ? <ChannelModal onClose={() => setChannelOpen(false)} /> : null}
    </div>
  );
}
