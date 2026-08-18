import { create } from "zustand";
import { getNdk } from "../../lib/nostr/ndk.ts";
import { decodeNpub } from "../../lib/nostr/nip19.ts";
import type { UserProfile } from "../../lib/nostr/types.ts";

const emptyProfile = (): UserProfile => ({
  name: "",
  displayName: "",
  about: "",
  picture: "",
});

function fromNdk(profile: {
  name?: string;
  displayName?: string;
  about?: string;
  picture?: string;
} | undefined): UserProfile {
  return {
    name: profile?.name ?? "",
    displayName: profile?.displayName ?? "",
    about: profile?.about ?? "",
    picture: profile?.picture ?? "",
  };
}

type Peeked = {
  pubkey: string;
  npub: string;
  profile: UserProfile;
};

type ProfileState = {
  own: UserProfile;
  peeked: Peeked | null;
  busy: boolean;
  error: string | null;
  loadOwn: (pubkey: string) => Promise<void>;
  saveOwn: (draft: UserProfile) => Promise<void>;
  lookup: (npubOrHex: string) => Promise<void>;
  clearPeek: () => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  own: emptyProfile(),
  peeked: null,
  busy: false,
  error: null,

  loadOwn: async (pubkey) => {
    set({ busy: true, error: null });
    try {
      const ndk = getNdk();
      const user = ndk.getUser({ pubkey });
      await user.fetchProfile();
      set({ own: fromNdk(user.profile), busy: false });
    } catch {
      set({ own: emptyProfile(), busy: false });
    }
  },

  saveOwn: async (draft) => {
    set({ busy: true, error: null });
    try {
      const ndk = getNdk();
      if (!ndk.activeUser) {
        throw new Error("no-active-user");
      }
      const user = ndk.activeUser;
      user.profile = {
        name: draft.name.trim(),
        displayName: draft.displayName.trim(),
        about: draft.about.trim(),
        picture: draft.picture.trim(),
      };
      await user.publish();
      set({ own: draft, busy: false });
    } catch {
      set({ busy: false, error: "profile-publish-failed" });
    }
  },

  lookup: async (npubOrHex) => {
    set({ busy: true, error: null, peeked: null });
    try {
      const trimmed = npubOrHex.trim();
      const pubkey = trimmed.startsWith("npub1") ? decodeNpub(trimmed) : trimmed.toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(pubkey)) {
        throw new Error("bad-pubkey");
      }
      const ndk = getNdk();
      const user = ndk.getUser({ pubkey });
      await user.fetchProfile();
      set({
        peeked: { pubkey, npub: user.npub, profile: fromNdk(user.profile) },
        busy: false,
      });
    } catch {
      set({ busy: false, error: "profile-lookup-failed" });
    }
  },

  clearPeek: () => set({ peeked: null, error: null }),
}));
