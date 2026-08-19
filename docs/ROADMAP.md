# Ágora — Roadmap

Nome de trabalho. Troca quando quiser.

App de comunidades, 100% código aberto (AGPL-3.0), sem empresa no meio. Identidade = chave Nostr. Qualquer um usa, lê, forka e sobe o próprio recinto.

---

## Decisão de arquitetura (travada)

Três planos separados. Não misturar.

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENTE ÁGORA (web → depois Tauri)                             │
│                                                                 │
│  1. PLANO DE DADOS          2. PALCO (5–10)                     │
│     chat, perfil, cargos       voz / webcam / tela              │
│     DMs, convites              720p30 mesh                      │
│         │                        │                              │
│         ▼                        ▼                              │
│     Nostr (relays)           Trystero + WebRTC                  │
│     + Tor opcional           signaling Nostr                    │
│     + NIP-44 nos DMs         nunca pelo Tor                     │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Plano de dados — Nostr + Tor

O Nostr é o **relay de eventos**: mensagens, perfil, servidores, canais, cargos, “tem uma live acontecendo”. Tudo isso é evento assinado.

O Tor **não cifra o conteúdo da conversa**. Ele esconde o *caminho*:

| Camada | O que faz | O que não faz |
|---|---|---|
| Assinatura Nostr | Prova que *você* mandou o evento | Não esconde o texto em canal público |
| NIP-44 / NIP-17 | Cifra DM (só remetente e destinatário lêem) | Não esconde que você falou com um relay |
| Tor (SOCKS / `.onion`) | Esconde seu IP, fura bloqueio de ISP/governo, seu provedor não vê “estou no relay X” | Não serve para vídeo. Latência alta, UDP ruim, stream morre |

Canal público no Nostr é **público** (assinado, não secreto). DM é secreto por NIP-44. Tor protege **metadados de rede** e o acesso ao relay.

Tor entra só neste plano:

- WebSocket do cliente → relays `wss://` via SOCKS5
- Relays `.onion` quando existirem
- Depois: sidecar Arti no app desktop

Nunca microfone, nunca câmera, nunca tela compartilhada passam pelo circuito Tor.

### 2. Palco — voz, câmera, tela (todo mundo fala)

Problema de **grupo pequeno**, ida e volta, < 300 ms. Teto **10** no 0.1.

Protocolo: **WebRTC** em malha, signaling **Nostr** via [Trystero](https://trystero.dev). Sem LiveKit. Sem JWT. Sem SFU.

Por que este e não o LiveKit do NIP-29 neste ciclo:

- O palco abre no **site** e no `.exe` com o mesmo código
- Ninguém precisa de servidor de mídia, Docker ou sidecar
- Captura **720p30**; a malha copia para cada par — documentado, sem downgrade escondido
- Sala privada: senha Trystero + chave gerada no cliente + envelope NIP-44 (nada em claro no relay)

Custo aceito: cada um vê o IP dos outros; sem TURN; 720p × (N−1) pode ficar imassistível. Detalhe: [`GOLIVE.md`](./GOLIVE.md).

LiveKit (tag `livekit` + JWT) fica **fora** do caminho do usuário. Quem quiser um SFU sobe o próprio. Não é o 0.1.

### 3. Ao vivo no 0.1 = o mesmo palco

Um transmite câmera/tela; os outros na sala assistem. **Não** é live pública 1→N. **Não** há WHIP/WHEP. **Não** há `kind 30311` com URL falsa. Outro cliente Nostr não assiste.

Broadcast 1→N (MediaMTX + WHIP/WHEP + NIP-53) fica na **Fase 9**, para quem hospeda VPS. Não misturar com o botão Ao vivo de agora.

---

## O que o Ágora é / não é

**É**

- Cliente de comunidades: servidores, canais, DMs, voz, webcam, Go Live
- Interoperável NIP-29 (os mesmos grupos aparecem no Nostrord, Groups, Obelisk…)
- Sem e-mail, sem telefone, sem empresa-alvo de liminar
- Moderação no grupo e no relay — quem hospeda define as regras
- Mute / block / filtros **locais** (controle do usuário)

**Não é**

- Clone pixel a pixel de outro cliente
- Mesh que inventa protocolo novo (Trystero já existe; Ágora não é uma spec P2P própria)
- Plataforma para atividade ilegal; o cliente não esconde crime
- Promessa de “vídeo anônimo pelo Tor”

---

## Stack

| Camada | Escolha |
|---|---|
| App | TypeScript, React 19, Vite, depois Tauri 2 |
| Nostr | NDK + nostr-tools |
| Identidade | `nsec` / `npub`, NIP-07, depois NIP-46 |
| DM | NIP-17 + NIP-44 + NIP-59 |
| Grupos | NIP-29 (subgrupos = canais) |
| Arquivos | Blossom |
| Palco | Trystero + WebRTC (720p30, até 10) |
| Limpar voz | DeepFilterNet 3 (wasm/modelo nesta origem) |
| Ao vivo 0.1 | O mesmo palco (sem WHIP) |
| Go Live 1→N | Fora do 0.1 (Fase 9, MediaMTX) |
| Anonimato de rede | Tor SOCKS5 + relays `.onion` |
| UI | tokens próprios (carvão / âmbar / papel) |
| i18n | `pt-BR` primeiro |
| Licença | AGPL-3.0-or-later |
| Teste | Vitest + Playwright |

---

## Vocabulário

| Conceito | Ágora |
|---|---|
| Conta | keypair Nostr |
| Perfil | `kind 0` |
| Servidor | grupo raiz NIP-29 (`kind 39000`) |
| Canal | subgrupo (`parent` / `child`) |
| Mensagem | evento com tag `h` |
| Cargo | `39001` / `39003` + mods `9000+` |
| DM | NIP-17 |
| Palco | Trystero (`agora-stage`) |
| Sala privada | chave local + envelope NIP-44 |
| Ao vivo 0.1 | câmera no mesmo palco |
| Arquivo | Blossom |
| Bloquear | NIP-51 (local) |

---

## Fases

Cada fase é entregável sozinha. Não misturar voz com Tor. Não misturar Go Live com o MVP de texto.

### Fase 0 — Fundação

- [x] Repositório, AGPL, README, princípios, `docs/SECURITY.md`
- [x] Scaffold Vite + React + tokens de UI + i18n `pt-BR`
- [x] Shell de 4 colunas (rail / canais / chat / membros)

**Pronto quando:** `pnpm dev` abre o casco com fixtures visuais.

### Fase 1 — Identidade e relays

- [x] Indicativo (apelido + foto opcional), cadeado de 8 caracteres neste PC, 12 palavras NIP-06
- [x] Indicativo público `AG-XXXX` derivado do npub; avatar gerado da chave
- [x] Emparelhar outro aparelho com código de 5 minutos
- [x] NIP-07 fica no caminho avançado
- [x] Pool NDK, adicionar/remover relay, status de conexão
- [x] Perfil `kind 0`

**Pronto quando:** duas contas publicam perfil e se enxergam.

### Fase 2 — Chat de texto (MVP de verdade)

- [x] Criar / entrar em grupo NIP-29 (`9007`, `9021`, convite)
- [x] Convite compartilhável NIP-19 (`naddr` + `?invite=`, `nostr:` / `agora:`)
- [x] Lista do usuário em `kind 10009`
- [x] Mensagens ao vivo com tag `h` + `previous`
- [x] Reply, reação (`kind 7`), markdown seguro

**Pronto quando:** duas janelas conversam num grupo; recarregar recupera histórico.

### Fase 3 — Servidor, canais e cargos

- [x] Subgrupos = canais e categorias
- [x] Cargos, membros, kick, apagar mensagem, pins
- [x] UI só mostra ação que o cargo permite

**Pronto quando:** admin cria `#geral` e `#memes`, remove um membro, o membro para de falar.

### Fase 4 — DM, arquivo, segurança local

- [x] DM NIP-17 (terceiro no mesmo relay não lê)
- [x] Gift wrap com jitter de `created_at` (NIP-59 / nostr-tools `randomNow`)
- [x] Upload Blossom (imagem no chat)
- [x] Strip de EXIF/GPS/IPTC/XMP antes do upload (JPEG/PNG/WebP)
- [x] Mute / block / palavras (NIP-51), só na *sua* tela

**Pronto quando:** DM cifrado funciona; mute esconde sem apagar no relay.

### Fase 5 — Palco P2P (Trystero)

- [x] Signaling Nostr (Trystero), sem LiveKit / JWT
- [x] ICE: host candidates; STUN Cloudflare; sem STUN Google; sem TURN
- [x] Mic, câmera, tela
- [x] 720p30; teto 10; aviso honesto de IP e de uplink
- [x] Canal de voz = `agora-stage` (não depende de servidor LiveKit)
- [x] Palco sempre começa em voz; câmera/tela/Ao vivo são opção
- [x] Indicador de quem está falando
- [x] DeepFilterNet 3 no mic deste PC (assets em `/deepfilternet3/`)
- [x] Sala privada: chave aleatória uma vez; envelope NIP-44; texto `agora1.`
- [x] Apagar canal de texto ou palco (NIP-29 `9008`)
- [x] F5 restaura a última praça e o último canal

**Pronto quando:** duas janelas do site se ouvem na LAN. **Fora do Tor.**

### Fase 6 — Ao vivo (mesmo palco)

- [x] Botão Ao vivo no site: câmera no palco, sem WHIP
- [x] Sem URL WHEP falsa no `kind 30311`
- [x] Aviso: 720p30 × (N−1) cópias pode ficar imassistível
- [x] Chat da live continua no Nostr (Fase 2)

**Pronto quando:** A transmite, até 9 assistem no Ágora. Outro cliente Nostr **não** assiste. Mídia **não** passa no Tor.

### Fase 6½ — Recinto (antes da 7)

O núcleo de texto/voz/live já está. Esta fatia é o casco da praça (o “servidor”) e a cara da UI. **Não mistura Tor.** Discussão primeiro; código depois, por passo.

- [x] Renderer de mídia: imagem/vídeo/link de verdade (hoje o 2º replace come o `<img>` e vaza `png" alt="" />`)
- [x] Casco mais rápido e responsivo (chat usa a largura; compositor e user dock fixos; sem scrollbar feia)
- [x] Ajustes **da praça** (não os do usuário): visão, canais, pessoas, sair; editar meta só se mod (9002)
- [x] Permissões honestas NIP-29, defaults de membro (falar, reagir, anexo, convite, voz no palco). Kick/apagar/pin/canal/editar praça = 39001. Sem 40 checkboxes que o relay ignora
- [x] Lista do recinto: todos os membros; separar por cargo; dono em evidência; espaço marcado para bots (bem depois). Online/offline **só com o que o protocolo já dá** — sem inventar presença que vaze IP ou “último visto”
- [x] Cartão de perfil ao clicar (kind 0 + `AG-XXXX` + about). Cara Ágora (papel/âmbar), não o popout roxo
- [x] OpenMoji no chat (composer + reações). Phosphor fica no chrome
- [x] Anexo de áudio (mp3/wav/m4a/ogg…) no mesmo Blossom; player `<audio>` no feed

**Pronto quando:** a imagem da primal aparece como foto; a engrenagem da praça abre o painel dela, não o do usuário; a lista do recinto agrupa por cargo sem mentir quem está “online”.

### Fase 7 — Tor no plano de dados

A tela existe. O SOCKS **ainda não** entra no WebSocket do NDK. Não marcar isto como pronto.

- [x] Setting SOCKS5 gravado (Tor Browser / `tor.exe` local)
- [x] Relays `.onion` na lista
- [x] Health-check heurístico (“tem onion + está ligado”)
- [x] Aviso na UI: Tor não carrega voz nem live; o palco revela IP aos pares
- [ ] Aplicar SOCKS no WebSocket do NDK (prova: `socksAppliedToNostr() === true`)
- [ ] Prova humana #6: texto num `.onion`; voz e live **não** tentam o circuito
- [ ] Depois (desktop): sidecar Arti

**Pronto quando:** com Tor na 9050, o chat de texto fala com um relay onion. O palco P2P continua em caminho direto — e o SOCKS **não** vaza para STUN.

### Fase 8 — Desktop

Repo próprio: [agorafoss/agora-desktop](https://github.com/agorafoss/agora-desktop). A UI é a deste site (`AGORA_CLIENT`). Sem copiar `src/`.

- [x] Tauri 2, instalador Windows (NSIS) — no repo desktop (`pnpm dev` / `pnpm build`)
- [x] Palco no site e no `.exe` (Trystero). Sem JWT no 0xchat
- [ ] Sidecar relay NIP-29 (a praça no PC) — depois
- [ ] Keystore nativo (ainda é o cofre da web)
- [x] Deep link `agora:` / `nostr:` registrado

**Pronto quando:** o `.exe` abre e entra nos mesmos grupos da versão web, inclusive o palco.

### Fase 9 — Depois do núcleo

Cada item vira passo próprio, não um saco.

- [ ] Threads
- [ ] OpenMoji completo: busca + categorias no CDN (sem empacotar os ~4k SVG). Ver README
- [ ] Emoji custom (NIP-30)
- [ ] Presença / status (protocolo; a lista da 6½ não inventa isto)
- [ ] Busca local
- [ ] Notificações do SO
- [ ] NIP-46 (bunker, chave fora do app)
- [ ] Companion opcional para quem hospeda **VPS** (relay +, se quiser, SFU/ingest 1→N). O usuário final sobe o recinto pelo [app de PC](./DESKTOP.md), sem Docker. Não é o palco do 0.1
- [ ] Denúncia no cliente (id do evento + relay) e guia de moderação para quem hospeda Blossom/relay
- [ ] Guia legal do self-hoster (rascunho em `HOSPEDAR.md` — não é conselho jurídico)
- [ ] Mobile (bem depois)

---

## Riscos que já aceitamos

| Risco | Mitigação |
|---|---|
| Relay NIP-29 cai e o “servidor” some | Fork / migração da spec; backup noutro relay; compose próprio na Fase 9 |
| Malha 720p30 × (N−1) esgota uplink de casa | Documentado na UI e em [`GOLIVE.md`](./GOLIVE.md). Sem downgrade escondido. Teto 10 |
| Correlação de timing Tor ↔ ICE clearnet do palco | Sem solução fácil. Documentado. UI avisa: palco revela IP aos pares |
| Host ICE / IP visível aos pares | Política aceita. STUN Cloudflare. Sem TURN neste ciclo |
| CDN de terceiros para DeepFilterNet (CORS) | Wasm/modelo vendored em `public/deepfilternet3/` |
| Chave de sala privada perdida com o cache | Envelope NIP-44 nas 12 palavras. Sem as palavras, a sala some para você |
| LiveKit / MediaMTX se alguém self-hostar 1→N | Fora do 0.1. Companion na Fase 9 |
| Brasil bloqueia relays conhecidos | Usuário cola qualquer URL; `.onion`; convite `naddr` fora da banda |
| `nsec` vaza = conta perdida | Cifra + aviso + NIP-07 / NIP-46 |
| Quem hospeda Blossom/relay é o recinto (lei local) | Princípio 8 + `HOSPEDAR.md`. Denúncia e política do recinto na Fase 9 |
| Escopo de “cliente completo” mata o projeto | Núcleo é texto. Palco, Tor e 1→N são fases isoladas |

---

## Como verificar (humano)

1. Duas janelas, duas contas, um grupo, conversam.
2. Admin kicka; o kickado para de publicar.
3. DM: terceiro no relay não lê.
4. Canal de voz: se ouvem **sem** Tor.
5. Palco: duas janelas se ouvem na LAN; Ao vivo é câmera no mesmo mesh; outro cliente Nostr não assiste.
6. SOCKS 9050: texto passa num `.onion`; voz e live **não** tentam o circuito. **Ainda não passa.** O setting existe; o NDK não usa SOCKS. Rodar este item é o primeiro trabalho da Fase 7, não um “já pronto”.

---

## Status

Arquitetura de transporte **travada**:

- **Nostr** = eventos
- **Tor** = anonimato do *caminho* desses eventos (SOCKS ainda não ligado)
- **NIP-44** = segredo das DMs
- **Trystero + WebRTC** = palco 720p30, até 10, mesh (sem LiveKit/MediaMTX no 0.1)

Núcleo de texto (Fases 0–4) está no cliente. Palco P2P no site (Fases 5–6), com salas privadas e DeepFilterNet 3. Próximo de transporte: **Fase 7** (SOCKS no NDK). App de PC: mesma UI, [agora-desktop](https://github.com/agorafoss/agora-desktop).
