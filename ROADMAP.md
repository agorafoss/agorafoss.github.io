# Ágora — Roadmap

Nome de trabalho. Troca quando quiser.

App de comunidades no modelo Discord, 100% código aberto (AGPL-3.0), sem empresa no meio. Identidade = chave Nostr. Qualquer um usa, lê, forka e sobe o próprio recinto.

---

## Decisão de arquitetura (travada)

Três planos separados. Não misturar.

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENTE ÁGORA (web → depois Tauri)                             │
│                                                                 │
│  1. PLANO DE DADOS          2. SALA INTERATIVA     3. GO LIVE   │
│     chat, perfil, cargos       voz / webcam          1 → N      │
│     DMs, convites,             canal estilo          transmissão│
│     anúncio de live            Discord               estilo     │
│                                                      “Go Live”  │
│         │                        │                      │       │
│         ▼                        ▼                      ▼       │
│     Nostr (relays)           LiveKit / WebRTC      MediaMTX     │
│     + Tor opcional           (NIP-29)              WHIP + WHEP  │
│     + NIP-44 nos DMs         nunca pelo Tor        + NIP-53     │
│                                                    nunca Tor    │
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

### 2. Sala interativa — voz e webcam (todo mundo fala)

Problema de **grupo pequeno/médio**, ida e volta, < 300 ms.

Protocolo: **WebRTC**, orquestrado pelo **LiveKit** (Apache-2.0), que é o caminho oficial do [NIP-29](https://nips.nostr.com/29) (`tag livekit` + JWT em `/.well-known/nip29/livekit/<grupo>`).

Por que este e não outro:

- Já é o padrão dos grupos Nostr — Ágora fala com os mesmos canais de voz do Nostrord / clientes NIP-29
- FOSS, self-host, sem taxa para a empresa LiveKit Cloud (a gente roda o binário)
- Mic + câmera + screenshare no mesmo room

### 3. Go Live — um transmite, N assistem

Problema **diferente** de sala de voz. LiveKit (todo mundo é “participante”) escala mal e fica caro em CPU quando 200 pessoas só querem *assistir*.

Pilha livre escolhida:

| Papel | Protocolo / peça | Licença | Por quê |
|---|---|---|---|
| Anúncio da live | **NIP-53** (`kind 30311`) no Nostr | aberto | O evento viaja pelos relays (e pode ir de Tor). Clientes Nostr já entendem. zap.stream usa isso. |
| Ingestão (câmera/OBS → servidor) | **WHIP** ([RFC 9725](https://www.rfc-editor.org/rfc/rfc9725.html)) | IETF | Um `POST` HTTP + WebRTC. Browser e OBS já falam. Sem SDK dono. |
| Playback (assistir) | **WHEP** (draft IETF, já estável na prática) e/ou **LL-HLS** | aberto | WHEP = baixa latência no browser. LL-HLS = cai em celular antigo / TV. |
| Servidor de mídia | **[MediaMTX](https://github.com/bluenviron/mediamtx)** | MIT | Um binário. WHIP, WHEP, RTMP, SRT, LL-HLS. Sem vendor. Qualquer um sobe no Docker. |
| Rede ruim (opcional) | **SRT** (Haivision, MPL) | aberto | OBS → SRT no MediaMTX quando a internet do streamer é instável. |

O evento NIP-53 só carrega a URL do stream (`streaming`). A mídia em si **não passa no relay Nostr e não passa no Tor**.

```
Streamer                         MediaMTX (seu VPS / o do servidor)
   câmera ──WHIP (WebRTC)──►  ingest
                                    │
Espectadores ◄──WHEP / LL-HLS───────┘

Enquanto isso, no Nostr (opcionalmente via Tor):
   kind 30311  “estou ao vivo, assista em whep://…”
   chat da live continua sendo NIP-29 / kind 9
```

**Alternativas consideradas e por que não são o padrão:**

- **LiveKit para Go Live** — ótimo para sala; ruim como CDN de 1→N. Fica como *sala*, não como broadcast.
- **Broadcast Box** — WHIP/WHEP lindo e mínimo. Reserva se a gente quiser um SFU de live ainda mais burro. MediaMTX ganha porque também fala RTMP/SRT/HLS no mesmo processo.
- **OvenMediaEngine** — poderoso, mas mais pesado e playback menos padrão.
- **Owncast / PeerTube Live** — produtos prontos, não um protocolo para embutir no cliente.
- **RTMP puro** — legado, o OBS está migrando para WHIP. Mantemos RTMP só como entrada secundária (MediaMTX já aceita).

Quem sobe um “servidor Ágora” no futuro sobe: **relay NIP-29 + LiveKit + MediaMTX**. Três processos, todos FOSS, todos self-host.

---

## O que o Ágora é / não é

**É**

- Cliente de comunidades: servidores, canais, DMs, voz, webcam, Go Live
- Interoperável NIP-29 (os mesmos grupos aparecem no Nostrord, Groups, Obelisk…)
- Sem e-mail, sem telefone, sem empresa-alvo de liminar
- Moderação no grupo e no relay — quem hospeda define as regras
- Mute / block / filtros **locais** (controle do usuário)

**Não é**

- Clone pixel a pixel do Discord
- Mesh P2P que inventa protocolo novo
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
| Voz / webcam | LiveKit JS + WebRTC |
| Go Live | NIP-53 + MediaMTX (WHIP / WHEP / LL-HLS) |
| Anonimato de rede | Tor SOCKS5 + relays `.onion` |
| UI | tokens próprios (carvão / âmbar / papel) — não blurple |
| i18n | `pt-BR` primeiro |
| Licença | AGPL-3.0-or-later |
| Teste | Vitest + Playwright |

---

## Mapa Discord → Ágora

| Discord | Ágora |
|---|---|
| Conta | keypair Nostr |
| Perfil | `kind 0` |
| Servidor | grupo raiz NIP-29 (`kind 39000`) |
| Canal | subgrupo (`parent` / `child`) |
| Mensagem | evento com tag `h` |
| Cargo | `39001` / `39003` + mods `9000+` |
| DM | NIP-17 |
| Voz / webcam | LiveKit (NIP-29) |
| Go Live | NIP-53 + MediaMTX |
| Arquivo | Blossom |
| Bloquear | NIP-51 (local) |

---

## Fases

Cada fase é entregável sozinha. Não misturar voz com Tor. Não misturar Go Live com o MVP de texto.

### Fase 0 — Fundação

- [x] Repositório, AGPL, README, princípios, `SECURITY.md`
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

### Fase 3 — Servidor estilo Discord

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

### Fase 5 — Voz e webcam (LiveKit)

- [x] Detectar tag `livekit` no grupo
- [x] JWT via NIP-98
- [x] Política ICE declarada (`src/lib/nostr/ice.ts`): host candidates aceitos; sem STUN Google; sem TURN-only
- [x] Mic, câmera
- [ ] Screenshare (LiveKit aceita; a UI ainda não tem o botão)
- [x] Participantes `kind 39004` ao vivo na lista (metadata já é lida)
- [x] Canal de voz = subgrupo AV-only

**Pronto quando:** dois usuários se ouvem e se veem. **Fora do Tor.**

### Fase 6 — Go Live (MediaMTX + NIP-53)

- [x] Composer “Ao vivo”: publicar `kind 30311` com URL `streaming`
- [x] Publicar via WHIP no MediaMTX (browser e OBS)
- [x] Aviso: Go Live revela o IP ao MediaMTX, mesmo com Tor no chat
- [ ] Assistir via WHEP **embutido** no cliente (`startWhep` existe; a UI ainda abre a URL)
- [ ] Fallback LL-HLS
- [x] Badge AO VIVO no canal
- [x] Chat da live continua no Nostr (Fase 2)
- [x] Doc: `docker compose` com MediaMTX para quem self-hosta

**Pronto quando:** A transmite, B assiste no canal, C vê o evento NIP-53 noutro cliente Nostr. Mídia **não** passa no Tor.

### Fase 6½ — Recinto (antes da 7)

O núcleo de texto/voz/live já está. Esta fatia é o casco da praça (o “servidor”) e a cara da UI. **Não mistura Tor.** Discussão primeiro; código depois, por passo.

- [x] Renderer de mídia: imagem/vídeo/link de verdade (hoje o 2º replace come o `<img>` e vaza `png" alt="" />`)
- [x] Casco mais rápido e responsivo (chat usa a largura; compositor e user dock fixos; sem scrollbar feia)
- [x] Ajustes **da praça** (não os do usuário): visão, canais, pessoas, sair; editar meta só se mod (9002)
- [x] Permissões honestas NIP-29, defaults estilo `@everyone` do Discord (falar, reagir, anexo, convite, voz se tiver LiveKit). Kick/apagar/pin/canal/editar praça = 39001. Sem 40 checkboxes que o relay ignora
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
- [x] Aviso na UI: Tor não carrega voz nem live; Go Live revela IP ao MediaMTX
- [ ] Aplicar SOCKS no WebSocket do NDK (prova: `socksAppliedToNostr() === true`)
- [ ] Prova humana #6: texto num `.onion`; voz e live **não** tentam o circuito
- [ ] Depois (desktop): sidecar Arti

**Pronto quando:** com Tor na 9050, o chat de texto fala com um relay onion. LiveKit e MediaMTX continuam em caminho direto — e o SOCKS **não** vaza para STUN/TURN.

### Fase 8 — Desktop

- [x] Tauri 2, instalador Windows (NSIS) — `pnpm tauri:dev` / `pnpm tauri:build`
- [ ] Keystore nativo (ainda é o cofre da web)
- [x] Deep link `agora:` / `nostr:` registrado

**Pronto quando:** o `.exe` abre e entra nos mesmos grupos da versão web.

### Fase 9 — Depois do núcleo

Cada item vira passo próprio, não um saco.

- [ ] Threads
- [ ] OpenMoji completo: busca + categorias no CDN (sem empacotar os ~4k SVG). Ver README
- [ ] Emoji custom (NIP-30)
- [ ] Presença / status (protocolo; a lista da 6½ não inventa isto)
- [ ] Busca local
- [ ] Notificações do SO
- [ ] NIP-46 (bunker, chave fora do app)
- [ ] Companion: `docker compose` com relay NIP-29 + LiveKit + MediaMTX (“subir meu servidor”)
- [ ] Denúncia no cliente (id do evento + relay) e guia de moderação para quem hospeda Blossom/relay
- [ ] Guia legal do self-hoster (rascunho em `docs/HOSPEDAR.md` — não é conselho jurídico)
- [ ] Mobile (bem depois)

---

## Riscos que já aceitamos

| Risco | Mitigação |
|---|---|
| Relay NIP-29 cai e o “servidor” some | Fork / migração da spec; backup noutro relay; compose próprio na Fase 9 |
| LiveKit / MediaMTX são servidores de mídia (alvo mais fácil que o chat) | Qualquer um self-hosta; o cliente só consome a URL anunciada |
| Correlação de timing Tor (kind 30311) ↔ WHIP clearnet | Sem solução fácil. Documentado. UI avisa: Go Live revela IP ao MediaMTX |
| Host ICE / IP visível ao SFU | Política aceita. Sem STUN Google. Sem TURN-only até termos TURN nosso |
| MediaMTX de nó único satura com muitos espectadores | Risco operacional, não de MVP. Companion na Fase 9; escala fica com quem hospeda |
| WHEP ainda é draft IETF | WHIP é RFC 9725. Não tratar o wire WHEP como congelado |
| Brasil bloqueia relays conhecidos | Usuário cola qualquer URL; `.onion`; convite `naddr` fora da banda |
| `nsec` vaza = conta perdida | Cifra + aviso + NIP-07 / NIP-46 |
| Quem hospeda Blossom/relay é o recinto (lei local) | Princípio 8 + `docs/HOSPEDAR.md`. Denúncia e política do recinto na Fase 9 |
| Escopo “Discord completo” mata o projeto | MVP é texto. Voz, live e Tor são fases seguintes, isoladas |

---

## Como verificar (humano)

1. Duas janelas, duas contas, um grupo, conversam.
2. Admin kicka; o kickado para de publicar.
3. DM: terceiro no relay não lê.
4. Canal de voz: se ouvem **sem** Tor.
5. Go Live: WHIP sobe, WHEP assiste, evento NIP-53 aparece.
6. SOCKS 9050: texto passa num `.onion`; voz e live **não** tentam o circuito. **Ainda não passa.** O setting existe; o NDK não usa SOCKS. Rodar este item é o primeiro trabalho da Fase 7, não um “já pronto”.

---

## Status

Arquitetura de transporte **travada**:

- **Nostr** = eventos
- **Tor** = anonimato do *caminho* desses eventos (SOCKS ainda não ligado)
- **NIP-44** = segredo das DMs
- **LiveKit** = sala de voz/webcam
- **MediaMTX + WHIP/WHEP + NIP-53** = Go Live

Núcleo de texto (Fases 0–4) está no cliente. Voz e live existem como cliente e dependem de servidor do outro lado.

Fase **6½ — Recinto** está no cliente. Próximo de transporte: **Fase 7** (SOCKS no NDK + prova humana #6). GitHub/Pages continua na prateleira.
