# Ágora

Cliente de comunidades no modelo Discord, sem empresa no meio.

Identidade é uma chave Nostr. Servidores são grupos [NIP-29](https://nips.nostr.com/29). Voz e webcam passam por LiveKit. Go Live usa MediaMTX (WHIP/WHEP) anunciado em [NIP-53](https://nips.nostr.com/53). Tor entra só no caminho das mensagens, nunca no vídeo.

Livre. AGPL-3.0-or-later. Qualquer um usa, lê, forka e sobe o próprio recinto.

## Três planos (não misturar)

| Plano | Peça | Função |
|---|---|---|
| Dados | Nostr + Tor opcional | Chat, perfil, cargos, anúncio de live |
| Segredo de DM | NIP-44 / NIP-17 | Só remetente e destinatário lêem |
| Sala de voz / webcam | LiveKit + WebRTC | Todo mundo fala. Fora do Tor |
| Go Live | MediaMTX + WHIP/WHEP + NIP-53 | Um transmite, N assistem. Fora do Tor |

Detalhe e fases: [`ROADMAP.md`](./ROADMAP.md). Princípios: [`docs/PRINCIPIOS.md`](./docs/PRINCIPIOS.md). Segurança e riscos aceitos: [`SECURITY.md`](./SECURITY.md). Quem hospeda: [`docs/HOSPEDAR.md`](./docs/HOSPEDAR.md).

## Rodar

Precisa de [Node 22+](https://nodejs.org/) e [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

Abre em `http://localhost:5173`. Crie o indicativo, uma praça, e fale no `#geral`.

```bash
pnpm test
pnpm build
```

## App de PC (Tauri 2)

Precisa do Rust em `C:\Users\User\ghost-tools` no PATH. Se a pasta do projeto tiver espaço (`Nova pasta`), o `windres` do MinGW quebra; os scripts mandam o target para `%USERPROFILE%\agora-target`.

```bash
pnpm tauri:dev
```

Instalador Windows (NSIS):

```bash
pnpm tauri:build
```

O `.exe` abre o mesmo cliente. Deep links `agora:` e `nostr:` ficam registrados. O cadeado ainda é o cofre da web; keystore nativo entra no restante da Fase 8.

Go Live self-host: [`docs/GOLIVE.md`](./docs/GOLIVE.md) (`docker compose up`).

## Ferramentas neste PC

Rust e MinGW já estão em `C:\Users\User\ghost-tools` (rustc 1.97, target `x86_64-pc-windows-gnu`). O desktop Tauri usa isso. O app web não precisa de Rust.

## Emoji (hoje e depois)

A grade do chat usa um **subset** de ~24 [OpenMoji](https://openmoji.org/) desenhados sob demanda no CDN (`jsdelivr` + unicode). O pacote completo **não** vai no `node_modules` — são milhares de SVG e inchariam o repo.

O teclado nativo já manda qualquer emoji como texto (unicode no relay).

**No futuro, para ter o catálogo inteiro sem o projeto ficar gigante:**

1. Continuar no CDN (não commitar os SVGs).
2. Grade com **busca + categorias**, pedindo só o SVG do código visível.
3. O evento no Nostr continua sendo o caractere unicode, não um `<img>`.
4. Emoji *custom do servidor* é outro passo: NIP-30, na Fase 9 do [`ROADMAP.md`](./ROADMAP.md).

## Licença

[AGPL-3.0-or-later](./LICENSE). Se você hospedar uma versão modificada na rede, o código fonte dessa versão tem que ficar público.
