# Ágora

> **Versão 0.2 (branch `0.2`).** Palco mesh, stream, salas privadas, DeepFilterNet 3. Tem bugs. **Não use para nada que não possa perder.** Relatos: [Issues](https://github.com/agorafoss/agorafoss.github.io/issues). O site público em `main` continua 0.1.

Cliente livre de comunidades no espírito de uma praça: servidores, canais, conversa, voz e transmissão. Sem empresa no meio, sem e-mail, sem telefone.

A identidade é uma chave [Nostr](https://nostr.com/). Uma praça é um grupo [NIP-29](https://nips.nostr.com/29). Quem tem as **12 palavras** entra em qualquer aparelho; o **cadeado** é o mesmo em todos. A interface nasce em português.

Licença [AGPL-3.0-or-later](./LICENSE). Qualquer um usa, lê, forka e, se hospedar uma versão modificada, abre o código.

Site público: [agorafoss.github.io](https://agorafoss.github.io/).

## O que é e o que não é

**É** um cliente. Fala com relays que você escolhe. Palco é malha P2P (Trystero + Nostr). Não temos API, não temos banco na nuvem, não desligamos a praça de ninguém.

**Não é** um clone de outro app de comunidades, nem uma promessa de “vídeo anônimo pelo Tor”, nem esconderijo para atividade ilegal.

Guia da plataforma (12 palavras, cadeado, chave de sala, palco, relays): no site `#docs`, no GitHub [`docs/GUIA.md`](./docs/GUIA.md). Princípios: [`docs/PRINCIPIOS.md`](./docs/PRINCIPIOS.md). Segurança: [`docs/SECURITY.md`](./docs/SECURITY.md). Relays: [`docs/RELAYS.md`](./docs/RELAYS.md). Quem hospeda: [`docs/HOSPEDAR.md`](./docs/HOSPEDAR.md). Fases: [`docs/ROADMAP.md`](./docs/ROADMAP.md).

## Três planos (não misturar)

| Plano | Peça | Função |
|---|---|---|
| Dados | Nostr, Tor opcional | Chat, perfil, cargos, convite |
| Segredo | NIP-44 / NIP-17 | Só remetente e destinatário lêem a DM |
| Palco | Trystero + WebRTC | Voz, câmera, tela. 720p30. Até 10 pessoas. Fora do Tor |

Tor esconde o *caminho* dos eventos. Não cifra o canal público e **não** carrega microfone, câmera nem live.

### Palco 720p30 — o que pode dar errado

A captura é **1280×720 a 30 fps**. A malha manda **uma cópia para cada outro** na sala. Um ao vivo para 9 pessoas pede da ordem de **18–22 Mbps de upload**. Várias câmeras ao mesmo tempo piora. Em internet de casa a live pode **travar, cortar o áudio ou ninguém ver**. Sem TURN: CGNAT e celular muitas vezes não conectam — use a mesma rede ou Tailscale. Os outros na sala **vêem o seu IP**. Não baixamos a qualidade no código para esconder isso.

O palco **sempre começa em voz**. Câmera e tela são opção. Até 10 pessoas. Quem está falando aparece na lista.

### Salas privadas

A chave **não** vai em claro para o relay. Na criação sai uma chave aleatória, **uma vez** — copia e manda no DM. Quem tem as **12 palavras** recupera o envelope NIP-44. Texto privado usa a mesma chave (`agora1.` AES-GCM). Se limpar o cache sem as 12 palavras, a sala some para você.

### Limpar voz

DeepFilterNet 3 corre **neste PC**. Wasm e modelo (~24 MB) saem desta origem, não de um CDN de terceiros. Não passam no relay. Se falhar, o palco segue com o denoise do browser.

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

Palco e Ao vivo abrem **neste site** (`pnpm dev`). Guia: [`docs/DESKTOP.md`](./docs/DESKTOP.md). Limites do palco: [`docs/GOLIVE.md`](./docs/GOLIVE.md).

## App de PC

Repositório separado: [agorafoss/agora-desktop](https://github.com/agorafoss/agora-desktop). A janela Tauri **monta esta UI**; não há um segundo `src/`. Clone os dois, `pnpm dev` na pasta do desktop. Rust no PATH. Deep links `agora:` e `nostr:` no instalador. O cadeado ainda é o cofre da web.

## Emoji

A grade do chat mostra um conjunto pequeno de [OpenMoji](https://openmoji.org/), buscado no CDN. O teclado do sistema já envia qualquer emoji como texto. O catálogo inteiro não entra no repositório — são milhares de arquivos. Como fazer isso depois, sem inchar o projeto, está no [`docs/ROADMAP.md`](./docs/ROADMAP.md) (Fase 9).

## Licença

[AGPL-3.0-or-later](./LICENSE).

---

# Ágora (English)

> **Version 0.2 (`0.2` branch).** Mesh stage, stream, private rooms, DeepFilterNet 3. There are bugs. **Do not use it for anything you cannot lose.** Reports: [Issues](https://github.com/agorafoss/agorafoss.github.io/issues). The public site on `main` stays 0.1.

A free community client in the spirit of a public square: servers, channels, chat, voice and broadcast. No company in the middle, no email, no phone number.

Identity is a [Nostr](https://nostr.com/) key. A square is a [NIP-29](https://nips.nostr.com/29) group. The **12-word phrase** is the account on any device; the **lock** is the same everywhere. The interface is born in Portuguese.

Licensed [AGPL-3.0-or-later](./LICENSE). Anyone may use, read, fork — and if you host a modified version, you publish the source.

Public site: [agorafoss.github.io](https://agorafoss.github.io/).

## What it is and is not

**It is** a client. It talks to relays you choose. The stage is a P2P mesh (Trystero + Nostr). We have no API, no cloud database, and we cannot switch off anyone’s square.

**It is not** a pixel-perfect clone of another community app, a promise of “anonymous video over Tor”, or a hideout for illegal activity.

Platform guide (12 words, lock, room key, stage, relays): on the site `#docs`, on GitHub [`docs/GUIA.md`](./docs/GUIA.md). Principles: [`docs/PRINCIPIOS.md`](./docs/PRINCIPIOS.md). Security: [`docs/SECURITY.md`](./docs/SECURITY.md). Relays: [`docs/RELAYS.md`](./docs/RELAYS.md). If you host: [`docs/HOSPEDAR.md`](./docs/HOSPEDAR.md). Phases: [`docs/ROADMAP.md`](./docs/ROADMAP.md).

## Three planes (do not mix them)

| Plane | Stack | Role |
|---|---|---|
| Data | Nostr, optional Tor | Chat, profile, roles, invites |
| Secrecy | NIP-44 / NIP-17 | Only sender and recipient read a DM |
| Stage | Trystero + WebRTC | Voice, camera, screen. 720p30. Up to 10 people. Off Tor |

Tor hides the *path* of events. It does not encrypt a public channel and it **never** carries microphone, camera or a live.

### Stage 720p30 — what can go wrong

Capture is **1280×720 at 30 fps**. The mesh sends **one copy to every other peer**. One live to 9 people is on the order of **18–22 Mbps upload**. Several cameras at once makes it worse. On a home link the live can **stall, drop audio, or nobody can watch**. No TURN: CGNAT and mobile often fail — same network or Tailscale. Others in the room **see your IP**. We do not silently drop quality in code to hide this.

The stage **always starts as voice**. Camera and screen are optional. Up to 10 people. Who is talking shows in the list.

### Private rooms

The key is **never** plaintext on the relay. At create time a random key is shown **once** — copy it and send it in a DM. The **12-word phrase** recovers the NIP-44 envelope. Private text uses the same key (`agora1.` AES-GCM). Clear the cache without the 12 words and the room is gone for you.

### Clean voice

DeepFilterNet 3 runs **on this PC**. WASM and model (~24 MB) come from this origin, not a third-party CDN. They never hit the relay. If it fails, the stage keeps the browser denoise.

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

Stage and Go Live open **on this site** (`pnpm dev`). Guide: [`docs/DESKTOP.md`](./docs/DESKTOP.md). Stage limits: [`docs/GOLIVE.md`](./docs/GOLIVE.md).

## Desktop app

Separate repo: [agorafoss/agora-desktop](https://github.com/agorafoss/agora-desktop). The Tauri window **builds this UI**; there is no second `src/`. Clone both, `pnpm dev` in the desktop folder. Rust on PATH. Deep links `agora:` and `nostr:` ship in the installer. The lock is still the web vault.

## Emoji

The chat grid shows a small [OpenMoji](https://openmoji.org/) set from a CDN. The system keyboard already sends any emoji as text. The full catalog is not in this repo. How to add it later without bloating the tree is in [`docs/ROADMAP.md`](./docs/ROADMAP.md) (phase 9).

## License

[AGPL-3.0-or-later](./LICENSE).
