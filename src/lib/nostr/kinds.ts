import type { NDKKind } from "@nostr-dev-kit/ndk";

export const KIND_METADATA = 0;
export const KIND_TEXT_NOTE = 1;
export const KIND_CONTACTS = 3;
export const KIND_REACTION = 7;
export const KIND_CHAT = 9;
export const KIND_DM_RUMOR = 14;
export const KIND_MUTE_LIST = 10000;
export const KIND_GROUP_LIST = 10009;
export const KIND_DM_RELAYS = 10050;
export const KIND_NIP98 = 27235;
export const KIND_BLOSSOM_AUTH = 24242;
export const KIND_APP_DATA = 30078;
export const KIND_LIVE = 30311 as NDKKind;
export const KIND_GIFT_WRAP = 1059;

export const KIND_GROUP_PUT_USER = 9000;
export const KIND_GROUP_REMOVE_USER = 9001;
export const KIND_GROUP_EDIT = 9002;
export const KIND_GROUP_DELETE_EVENT = 9005 as NDKKind;
export const KIND_GROUP_CREATE = 9007;
export const KIND_GROUP_DELETE = 9008 as NDKKind;
export const KIND_GROUP_INVITE = 9009 as NDKKind;
export const KIND_GROUP_PINS_EDIT = 9010 as NDKKind;
export const KIND_GROUP_JOIN = 9021;
export const KIND_GROUP_LEAVE = 9022 as NDKKind;

export const KIND_GROUP_META = 39000;
export const KIND_GROUP_ADMINS = 39001;
export const KIND_GROUP_MEMBERS = 39002;
export const KIND_GROUP_ROLES = 39003 as NDKKind;
export const KIND_GROUP_LIVEKIT = 39004 as NDKKind;
export const KIND_GROUP_PINS = 39005 as NDKKind;
