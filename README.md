# Ágora

Cliente livre de comunidades no espírito de uma praça: servidores, canais, conversa, voz e transmissão. Sem empresa no meio, sem e-mail, sem telefone.

A identidade é uma chave [Nostr](https://nostr.com/). Uma praça é um grupo [NIP-29](https://nips.nostr.com/29). Quem tem as **12 palavras** entra em qualquer aparelho; o **cadeado** é o mesmo em todos. A interface nasce em português.

Licença [AGPL-3.0-or-later](./LICENSE). Qualquer um usa, lê, forka e, se hospedar uma versão modificada, abre o código.

Site público: [agorafoss.github.io](https://agorafoss.github.io/).

## O que é e o que não é

**É** um cliente. Fala com relays e servidores de mídia que você escolhe. Não temos API, não temos banco na nuvem, não desligamos a praça de ninguém.

**Não é** um clone de outro app de comunidades, nem uma promessa de “vídeo anônimo pelo Tor”, nem esconderijo para atividade ilegal.

Princípios: [`docs/PRINCIPIOS.md`](./docs/PRINCIPIOS.md). Segurança: [`SECURITY.md`](./SECURITY.md). Quem sobe relay ou mídia: [`docs/HOSPEDAR.md`](./docs/HOSPEDAR.md). Fases: [`ROADMAP.md`](./ROADMAP.md).

## Três planos (não misturar)

| Plano | Peça | Função |
|---|---|---|
| Dados | Nostr, Tor opcional | Chat, perfil, cargos, convite, anúncio de live |
| Segredo | NIP-44 / NIP-17 | Só remetente e destinatário lêem a DM |
| Sala | LiveKit + WebRTC | Voz e webcam. Fora do Tor |
| Transmissão | MediaMTX + WHIP/WHEP + NIP-53 | Um transmite, N assistem. Fora do Tor |

Tor esconde o *caminho* dos eventos. Não cifra o canal público e **não** carrega microfone, câmera nem live. Publicar um Go Live revela o IP ao servidor de mídia.

## Rodar o cliente

Node 22 ou mais novo e [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:5173`. Crie o indicativo, anote as 12 palavras e o cadeado, entre numa praça, fale no `#geral`.

```bash
pnpm test
pnpm build
```

Para transmitir: [`docs/GOLIVE.md`](./docs/GOLIVE.md) (`docker compose up`).

## App de PC

O mesmo cliente, empacotado com Tauri 2 (`pnpm tauri:dev` / `pnpm tauri:build`). Precisa de Rust no PATH. Deep links `agora:` e `nostr:` ficam registrados. O cadeado ainda é o cofre da web.

## Emoji

A grade do chat mostra um conjunto pequeno de [OpenMoji](https://openmoji.org/), buscado no CDN. O teclado do sistema já envia qualquer emoji como texto. O catálogo inteiro não entra no repositório — são milhares de arquivos. Como fazer isso depois, sem inchar o projeto, está no [`ROADMAP.md`](./ROADMAP.md) (Fase 9).

## Licença

[AGPL-3.0-or-later](./LICENSE).

---

# Ágora (English)

A free community client in the spirit of a public square: servers, channels, chat, voice and broadcast. No company in the middle, no email, no phone number.

Identity is a [Nostr](https://nostr.com/) key. A square is a [NIP-29](https://nips.nostr.com/29) group. The **12-word phrase** is the account on any device; the **lock** is the same everywhere. The interface is born in Portuguese.

Licensed [AGPL-3.0-or-later](./LICENSE). Anyone may use, read, fork — and if you host a modified version, you publish the source.

Public site: [agorafoss.github.io](https://agorafoss.github.io/).

## What it is and is not

**It is** a client. It talks to relays and media servers you choose. We have no API, no cloud database, and we cannot switch off anyone’s square.

**It is not** a pixel-perfect clone of another community app, a promise of “anonymous video over Tor”, or a hideout for illegal activity.

Principles: [`docs/PRINCIPIOS.md`](./docs/PRINCIPIOS.md). Security: [`SECURITY.md`](./SECURITY.md). If you run a relay or media stack: [`docs/HOSPEDAR.md`](./docs/HOSPEDAR.md). Phases: [`ROADMAP.md`](./ROADMAP.md).

## Three planes (do not mix them)

| Plane | Stack | Role |
|---|---|---|
| Data | Nostr, optional Tor | Chat, profile, roles, invites, live announcements |
| Secrecy | NIP-44 / NIP-17 | Only sender and recipient read a DM |
| Room | LiveKit + WebRTC | Voice and webcam. Off Tor |
| Broadcast | MediaMTX + WHIP/WHEP + NIP-53 | One streams, many watch. Off Tor |

Tor hides the *path* of events. It does not encrypt a public channel and it **never** carries microphone, camera or a live. Going live reveals your IP to the media server.

## Run the client

Node 22+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Create a callsign, write down the 12 words and the lock, join a square, speak in `#geral`.

```bash
pnpm test
pnpm build
```

To broadcast: [`docs/GOLIVE.md`](./docs/GOLIVE.md) (`docker compose up`).

## Desktop app

The same client, packaged with Tauri 2 (`pnpm tauri:dev` / `pnpm tauri:build`). Rust must be on your PATH. Deep links `agora:` and `nostr:` are registered. The lock is still the web vault.

## Emoji

The chat grid shows a small [OpenMoji](https://openmoji.org/) set from a CDN. The system keyboard already sends any emoji as text. The full catalog is not in this repo. How to add it later without bloating the tree is in [`ROADMAP.md`](./ROADMAP.md) (phase 9).

## License

[AGPL-3.0-or-later](./LICENSE).
