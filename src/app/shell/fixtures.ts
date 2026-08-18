// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export type ChannelKind = "text" | "voice";

export type Channel = {
  id: string;
  name: string;
  kind: ChannelKind;
  topic?: string;
  live?: boolean;
  talking?: number;
};

export type Category = {
  id: string;
  nameKey: "channels.text" | "channels.voice";
  channels: Channel[];
};

export type Member = {
  id: string;
  name: string;
  role: "owner" | "mod" | "member";
  online: boolean;
  hue: number;
};

export type ChatMessage = {
  id: string;
  authorId: string;
  body: string;
  time: string;
};

export type Server = {
  id: string;
  name: string;
  short: string;
  hue: number;
  relay: string;
  categories: Category[];
  members: Member[];
  messages: Record<string, ChatMessage[]>;
};

export const demoUser = {
  name: "Rafa",
  npubShort: "npub1rafa…k3",
  hue: 32,
};

export const servers: Server[] = [
  {
    id: "oficina",
    name: "Oficina da Esquina",
    short: "OE",
    hue: 32,
    relay: "oficina.local",
    categories: [
      {
        id: "texto",
        nameKey: "channels.text",
        channels: [
          { id: "geral", name: "geral", kind: "text", topic: "Recado da casa e o que está no ar." },
          { id: "palestra", name: "palestra", kind: "text", topic: "Fios longos. Sem pressa." },
          { id: "arquivos", name: "arquivos", kind: "text" },
        ],
      },
      {
        id: "voz",
        nameKey: "channels.voice",
        channels: [
          { id: "palco", name: "palco", kind: "voice", live: true, talking: 3 },
          { id: "camarim", name: "camarim", kind: "voice", talking: 0 },
        ],
      },
    ],
    members: [
      { id: "rafa", name: "Rafa", role: "owner", online: true, hue: 32 },
      { id: "lia", name: "Lia Mendes", role: "mod", online: true, hue: 148 },
      { id: "caio", name: "Caio", role: "member", online: true, hue: 200 },
      { id: "nara", name: "Nara", role: "member", online: true, hue: 12 },
      { id: "vito", name: "Vito", role: "member", online: false, hue: 260 },
    ],
    messages: {
      geral: [
        {
          id: "m1",
          authorId: "lia",
          time: "19:02",
          body: "O palco está aberto. Quem for falar no ar, testa o microfone no camarim antes.",
        },
        {
          id: "m2",
          authorId: "caio",
          time: "19:04",
          body: "Testei. Sem eco. A câmera eu deixo só se precisar.",
        },
        {
          id: "m3",
          authorId: "nara",
          time: "19:07",
          body: "Gente, só lembrando: o recado longo vai em #palestra. Aqui é o que está acontecendo agora.",
        },
        {
          id: "m4",
          authorId: "rafa",
          time: "19:11",
          body: "Combinado. A live de hoje não passa por nenhum circuito de anonimato. Quem quiser só texto, fica no chat.",
        },
      ],
      palestra: [
        {
          id: "p1",
          authorId: "rafa",
          time: "18:40",
          body: "A praça não tem dono. Quem hospeda o relay escreve as regras daquele recinto. Se não gostar, leva a história para outro.",
        },
      ],
      arquivos: [],
    },
  },
  {
    id: "semente",
    name: "Semente",
    short: "SE",
    hue: 150,
    relay: "semente.onion",
    categories: [
      {
        id: "texto",
        nameKey: "channels.text",
        channels: [{ id: "patio", name: "pátio", kind: "text" }],
      },
    ],
    members: [{ id: "rafa", name: "Rafa", role: "owner", online: true, hue: 32 }],
    messages: { patio: [] },
  },
];

export function findServer(id: string | null): Server | undefined {
  return servers.find((server) => server.id === id);
}

export function findChannel(server: Server | undefined, channelId: string | null): Channel | undefined {
  if (!server || !channelId) return undefined;
  return server.categories.flatMap((category) => category.channels).find((channel) => channel.id === channelId);
}

export function findMember(server: Server, id: string): Member | undefined {
  return server.members.find((member) => member.id === id);
}
