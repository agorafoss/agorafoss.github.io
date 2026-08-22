// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "note"; text: string };

export type GuideSection = {
  id: string;
  title: string;
  blocks: GuideBlock[];
};

export type Guide = {
  kicker: string;
  title: string;
  lead: string;
  github: string;
  sections: GuideSection[];
};

const pt: Guide = {
  kicker: "Ágora",
  title: "Como a praça funciona",
  lead: "Isto é o mapa. Sem marketing. A conta é uma chave. A praça mora num relay. O palco é malha entre browsers. Três segredos diferentes: 12 palavras, cadeado, chave de sala.",
  github: "No repositório: docs/GUIA.md e o restante em docs/.",
  sections: [
    {
      id: "o-que-e",
      title: "O que é",
      blocks: [
        {
          type: "p",
          text: "O Ágora é um cliente de comunidades. Não tem API nossa, não tem banco na nuvem, não tem conta corporativa. Você fala com relays Nostr que você escolhe. Quem hospeda o relay é o recinto — não o projeto Ágora.",
        },
        {
          type: "ul",
          items: [
            "Chat, praça, canais, cargos: Nostr (NIP-29).",
            "DM: cifrada (NIP-17 / NIP-44). Terceiro no relay não lê o texto.",
            "Palco (voz, câmera, tela): malha P2P (Trystero + WebRTC). Não passa no Tor.",
            "Arquivo no chat: Blossom. O relay só vê a URL.",
          ],
        },
        {
          type: "note",
          text: "Não é clone de outro app. Não é vídeo anônimo. Não é esconderijo. Versão inicial: tem bugs. Não use para o que não pode perder.",
        },
      ],
    },
    {
      id: "identidade",
      title: "Identidade: 12 palavras, cadeado, indicativo",
      blocks: [
        {
          type: "p",
          text: "Não há e-mail. A conta é um par de chaves Nostr. As 12 palavras (NIP-06) são a semente. Quem as tem é você em qualquer aparelho.",
        },
        {
          type: "table",
          headers: ["Segredo", "Para quê", "Onde vive"],
          rows: [
            ["12 palavras", "A conta. Mesmo AG-XXXX, mesmas DMs, mesmos envelopes de sala.", "Na sua cabeça / papel. Nunca no relay."],
            ["Cadeado (8 caracteres)", "Destrancar este browser. Não é a conta.", "Só neste PC. Sem as 12 palavras, limpar o site apaga o cadeado e a chave local."],
            ["Indicativo AG-XXXX", "Nome público derivado do npub. Não é senha.", "Todo mundo vê."],
          ],
        },
        {
          type: "p",
          text: "Na criação o app mostra as 12 palavras uma vez. Anote. Não existe “esqueci a senha”. Perdeu as palavras, perdeu a conta. O cadeado pede de novo neste aparelho; noutro aparelho você cola as 12 palavras e escolhe um cadeado (o mesmo, se quiser).",
        },
        {
          type: "note",
          text: "Ninguém do Ágora, do GitHub ou do relay consegue recuperar as 12 palavras. Se alguém pedir isso em issue, é golpe.",
        },
      ],
    },
    {
      id: "sala-privada",
      title: "Chave de sala (não são as 12 palavras)",
      blocks: [
        {
          type: "p",
          text: "Quando você cria um palco ou canal marcado privado, o Ágora gera um código aleatório (tipo 4E66K-H3JK4-…). Isso é a senha daquela sala, não da sua conta. A tela “Copia esta chave” mostra isso uma vez.",
        },
        {
          type: "ul",
          items: [
            "Copia e manda no DM a quem entra. Sem isto a porta fica trancada.",
            "O relay não guarda o código em claro. Vai um envelope cifrado (NIP-44).",
            "Você em outro PC: entra com as 12 palavras. O cliente abre o envelope e destranca a sala sozinho.",
            "Quem só recebeu o código no DM cola na porta. Não precisa das suas 12 palavras (e não deve tê-las).",
            "Limpou o site sem as 12 palavras: a conta some. A sala só volta se você tiver o código copiado, ou o envelope + as palavras.",
          ],
        },
        {
          type: "note",
          text: "As 12 palavras não aparecem nessa carta de propósito. Já foram na criação da conta. Misturar os dois segredos é o jeito mais fácil de vazar a identidade.",
        },
      ],
    },
    {
      id: "praca",
      title: "Praça, canais, cargos",
      blocks: [
        {
          type: "p",
          text: "Uma praça é um grupo NIP-29. Ela mora num relay — um endereço wss://. O #geral dessa praça no groups.0xchat.com não aparece no Damus. Relays não se copiam entre si.",
        },
        {
          type: "ul",
          items: [
            "Criar praça: o padrão é wss://groups.0xchat.com (aceita kind 9007). groups.fiatjaf.com recusa criar pelo cliente — use o site deles ou outro wss://.",
            "Entrar: id da praça + o mesmo wss://, ou o convite agora: / nostr: / naddr.",
            "Canais de texto e palcos são subgrupos. Apagar canal é cargo NIP-29 (9008).",
            "Dono e mods: kick, apagar mensagem, pin, criar canal. Mute/block no cliente só esconde na sua tela.",
          ],
        },
      ],
    },
    {
      id: "palco",
      title: "Palco: voz, câmera, tela",
      blocks: [
        {
          type: "p",
          text: "O palco sempre abre em voz. Câmera e tela são botões à parte. Não há um quarto botão “Transmitir” no palco — isso era o antigo Ao vivo, que só ligava a câmera de novo.",
        },
        {
          type: "ul",
          items: [
            "Microfone, câmera e tela são permissões separadas. Sem mic a sala ainda abre; Falar tenta o mic de novo. Câmera não pede mic.",
            "Captura 1280×720 a 30 fps. Cada um manda uma cópia para cada outro. Teto 10 pessoas.",
            "Os outros na sala vêem o seu IP. Sem TURN: CGNAT e celular muitas vezes falham. Mesma LAN ou Tailscale.",
            "Tor do chat não cobre o palco.",
            "Limpar voz (DeepFilterNet 3) corre neste PC. Wasm e modelo nesta origem (~24 MB). Se falhar, fica o denoise do browser.",
          ],
        },
        {
          type: "note",
          text: "Com várias câmeras em internet de casa a live pode travar ou ninguém ver. Está escrito na UI. Não baixamos a qualidade no código para esconder isso.",
        },
      ],
    },
    {
      id: "relays",
      title: "Relays",
      blocks: [
        {
          type: "p",
          text: "Um relay é um WebSocket burro: guarda eventos assinados e entrega a quem pede. Relays não formam uma rede entre si. O cliente é quem publica em vários ao mesmo tempo.",
        },
        {
          type: "table",
          headers: ["Endereço", "Papel"],
          rows: [
            ["relay.damus.io, nos.lol, relay.primal.net", "Perfil, DM embrulhada. strfry. Não hospeda a praça."],
            ["purplepag.es", "Diretório de perfil/listas. Não é chat."],
            ["groups.0xchat.com", "Onde o Ágora cria praça por omissão. NIP-29."],
            ["groups.fiatjaf.com", "NIP-29 de teste. Recusa criar grupo pelo cliente."],
          ],
        },
        {
          type: "p",
          text: "A praça precisa de um relay NIP-29. Um strfry tipo Damus não serve. Para subir o seu: VPS + domínio + TLS + Khatru/khatru29. No Ágora, cole esse wss:// no campo da praça. Guia longo: docs/RELAYS.md.",
        },
        {
          type: "note",
          text: "No 0.2 o signaling do palco (kinds 20xxx) não vai para Damus, purplepag.es nem relays de grupo — eles recusam e enchiam o F12. Vai para nos.lol, primal e nostr.oxtr.dev. offchain.pub e nostr.band ficaram de fora (WoT / WebSocket morto). Chat continua nos relays da lista.",
        },
      ],
    },
    {
      id: "tor",
      title: "Tor",
      blocks: [
        {
          type: "p",
          text: "Tor esconde o caminho dos eventos Nostr (IP, bloqueio de ISP). Não cifra o canal público. DM já é NIP-44, com ou sem Tor.",
        },
        {
          type: "ul",
          items: [
            "A tela de circuito grava SOCKS5. O WebSocket do NDK ainda não usa isso (Fase 7).",
            "Voz e live nunca entram no circuito.",
            "Relay .onion no 0.2 ainda não viaja pelo SOCKS.",
          ],
        },
      ],
    },
    {
      id: "desktop",
      title: "App de PC",
      blocks: [
        {
          type: "p",
          text: "O repositório agora-desktop é só a janela Tauri. A UI é a deste site. Não copie a pasta src/. Clone os dois, pnpm dev no desktop.",
        },
        {
          type: "ul",
          items: [
            "Já tem: janela, instalador NSIS, a mesma praça e o mesmo palco, deep links agora: e nostr:.",
            "Ainda não: keystore nativo (cadeado continua o cofre da web), relay NIP-29 dentro do .exe, sidecar Tor.",
          ],
        },
      ],
    },
    {
      id: "nao-e",
      title: "O que isto não é",
      blocks: [
        {
          type: "ul",
          items: [
            "Não desliga a praça de ninguém. Não temos o soquete.",
            "Não é live pública 1→N. Outro cliente Nostr não assiste o palco.",
            "Não filtra conteúdo automático. Quem hospeda o relay responde na própria jurisdição.",
            "Não recupera 12 palavras. Não guarda senha de sala em claro no relay.",
          ],
        },
        {
          type: "p",
          text: "Código: AGPL-3.0. Issues: github.com/agorafoss/agorafoss.github.io. Palco e stream nesta branch 0.2. O site público em main continua 0.1 até vocês misturarem.",
        },
      ],
    },
  ],
};

const en: Guide = {
  kicker: "Ágora",
  title: "How the square works",
  lead: "This is the map. No marketing. The account is a key. The square lives on one relay. The stage is a mesh between browsers. Three different secrets: 12 words, lock, room key.",
  github: "In the repo: docs/GUIA.md and the rest under docs/.",
  sections: [
    {
      id: "o-que-e",
      title: "What it is",
      blocks: [
        {
          type: "p",
          text: "Ágora is a community client. No API of ours, no cloud database, no corporate account. You talk to Nostr relays you choose. Whoever hosts the relay is the venue — not the Ágora project.",
        },
        {
          type: "ul",
          items: [
            "Chat, square, channels, roles: Nostr (NIP-29).",
            "DMs: encrypted (NIP-17 / NIP-44). A third party on the relay cannot read the text.",
            "Stage (voice, camera, screen): P2P mesh (Trystero + WebRTC). Never on Tor.",
            "Chat files: Blossom. The relay only sees the URL.",
          ],
        },
        {
          type: "note",
          text: "Not a clone of another app. Not anonymous video. Not a hideout. Early version: there are bugs. Do not use it for anything you cannot lose.",
        },
      ],
    },
    {
      id: "identidade",
      title: "Identity: 12 words, lock, callsign",
      blocks: [
        {
          type: "p",
          text: "There is no email. The account is a Nostr keypair. The 12 words (NIP-06) are the seed. Whoever has them is you on any device.",
        },
        {
          type: "table",
          headers: ["Secret", "What it is for", "Where it lives"],
          rows: [
            ["12 words", "The account. Same AG-XXXX, same DMs, same room envelopes.", "In your head / on paper. Never on the relay."],
            ["Lock (8 characters)", "Unlock this browser. It is not the account.", "This PC only. Without the 12 words, clearing the site drops the lock and the local key."],
            ["Callsign AG-XXXX", "Public name derived from the npub. Not a password.", "Everyone sees it."],
          ],
        },
        {
          type: "p",
          text: "At create time the app shows the 12 words once. Write them down. There is no “forgot password”. Lose the words, lose the account. The lock is asked again on this device; on another device you paste the 12 words and pick a lock (the same one, if you want).",
        },
        {
          type: "note",
          text: "Nobody at Ágora, GitHub, or the relay can recover the 12 words. If someone asks for them in an issue, it is a scam.",
        },
      ],
    },
    {
      id: "sala-privada",
      title: "Room key (not the 12 words)",
      blocks: [
        {
          type: "p",
          text: "When you create a private stage or channel, Ágora generates a random code (like 4E66K-H3JK4-…). That is the password for that room, not for your account. The “Copy this key” card shows it once.",
        },
        {
          type: "ul",
          items: [
            "Copy it and send it in a DM to whoever joins. Without it the door stays locked.",
            "The relay does not store the code in plaintext. It stores a NIP-44 envelope.",
            "You on another PC: sign in with the 12 words. The client opens the envelope and unlocks the room.",
            "Someone who only got the code in a DM pastes it at the door. They must not have your 12 words.",
            "Clear the site without the 12 words: the account is gone. The room only returns if you still have the copied code, or the envelope plus the words.",
          ],
        },
        {
          type: "note",
          text: "The 12 words are not on that card on purpose. They already appeared when the account was created. Mixing the two secrets is the fastest way to leak the identity.",
        },
      ],
    },
    {
      id: "praca",
      title: "Square, channels, roles",
      blocks: [
        {
          type: "p",
          text: "A square is a NIP-29 group. It lives on one relay — a wss:// address. That square’s #geral on groups.0xchat.com does not appear on Damus. Relays do not copy each other.",
        },
        {
          type: "ul",
          items: [
            "Create: default is wss://groups.0xchat.com (accepts kind 9007). groups.fiatjaf.com refuses client-side create — use their site or another wss://.",
            "Join: square id + the same wss://, or an agora: / nostr: / naddr invite.",
            "Text channels and stages are subgroups. Deleting a channel is a NIP-29 role (9008).",
            "Owner and mods: kick, delete message, pin, create channel. Mute/block in the client only hides it on your screen.",
          ],
        },
      ],
    },
    {
      id: "palco",
      title: "Stage: voice, camera, screen",
      blocks: [
        {
          type: "p",
          text: "The stage always opens as voice. Camera and screen are separate buttons. There is no fourth “Broadcast” button on the stage — that was the old Go Live, which only turned the camera on again.",
        },
        {
          type: "ul",
          items: [
            "Mic, camera and screen are separate permissions. Without a mic the room still opens; Speak retries the mic. Camera does not ask for the mic.",
            "Capture is 1280×720 at 30 fps. Each peer sends a copy to every other. Cap is 10 people.",
            "Others in the room see your IP. No TURN: CGNAT and mobile often fail. Same LAN or Tailscale.",
            "Chat Tor does not cover the stage.",
            "Clean voice (DeepFilterNet 3) runs on this PC. WASM and model from this origin (~24 MB). If it fails, the browser denoise stays.",
          ],
        },
        {
          type: "note",
          text: "Several cameras on a home link can stall or nobody can watch. The UI says so. We do not silently drop quality in code to hide it.",
        },
      ],
    },
    {
      id: "relays",
      title: "Relays",
      blocks: [
        {
          type: "p",
          text: "A relay is a dumb WebSocket: it stores signed events and hands them to whoever asks. Relays do not form a network with each other. The client publishes to several at once.",
        },
        {
          type: "table",
          headers: ["Address", "Role"],
          rows: [
            ["relay.damus.io, nos.lol, relay.primal.net", "Profile, wrapped DMs. strfry. Does not host the square."],
            ["purplepag.es", "Profile/list directory. Not chat."],
            ["groups.0xchat.com", "Where Ágora creates squares by default. NIP-29."],
            ["groups.fiatjaf.com", "NIP-29 test relay. Refuses client-side group create."],
          ],
        },
        {
          type: "p",
          text: "A square needs a NIP-29 relay. A Damus-style strfry will not do. To run yours: VPS + domain + TLS + Khatru/khatru29. In Ágora, paste that wss:// in the square field. Long guide: docs/RELAYS.md.",
        },
        {
          type: "note",
          text: "In 0.2, stage signaling (kinds 20xxx) does not go to Damus, purplepag.es or group relays — they reject it and flooded the console. It goes to nos.lol, primal and nostr.oxtr.dev. offchain.pub and nostr.band are out (WoT / dead WebSocket). Chat still uses the list in settings.",
        },
      ],
    },
    {
      id: "tor",
      title: "Tor",
      blocks: [
        {
          type: "p",
          text: "Tor hides the path of Nostr events (IP, ISP blocks). It does not encrypt a public channel. DMs are already NIP-44, with or without Tor.",
        },
        {
          type: "ul",
          items: [
            "The circuit screen stores SOCKS5. The NDK WebSocket does not use it yet (phase 7).",
            "Voice and live never enter the circuit.",
            "An .onion relay in 0.2 still does not travel through SOCKS.",
          ],
        },
      ],
    },
    {
      id: "desktop",
      title: "PC app",
      blocks: [
        {
          type: "p",
          text: "The agora-desktop repo is only the Tauri window. The UI is this site. Do not copy the src/ folder. Clone both, pnpm dev in the desktop folder.",
        },
        {
          type: "ul",
          items: [
            "Already there: window, NSIS installer, the same square and stage, agora: and nostr: deep links.",
            "Not yet: native keystore (the lock is still the web vault), NIP-29 relay inside the .exe, Tor sidecar.",
          ],
        },
      ],
    },
    {
      id: "nao-e",
      title: "What this is not",
      blocks: [
        {
          type: "ul",
          items: [
            "It cannot switch off anyone’s square. We do not run the socket.",
            "It is not a public 1→N live. Another Nostr client does not watch the stage.",
            "It does not filter content automatically. Whoever hosts the relay answers in their own jurisdiction.",
            "It does not recover 12 words. It does not store a room password in plaintext on the relay.",
          ],
        },
        {
          type: "p",
          text: "License: AGPL-3.0. Issues: github.com/agorafoss/agorafoss.github.io. Stage and stream live on this 0.2 branch. The public site on main stays 0.1 until you merge.",
        },
      ],
    },
  ],
};

export function guideFor(locale: string): Guide {
  return locale.toLowerCase().startsWith("en") ? en : pt;
}

export const GUIDE_SECTION_IDS = pt.sections.map((section) => section.id);
