export type AppView = "home" | "dms" | "server";

export type AppRoute = {
  view: AppView;
  serverId: string | null;
  channelId: string | null;
};

export const defaultRoute: AppRoute = {
  view: "server",
  serverId: "oficina",
  channelId: "geral",
};
