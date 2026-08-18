// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

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
