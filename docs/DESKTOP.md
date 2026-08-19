# App de PC

O site ([agorafoss.github.io](https://agorafoss.github.io/)) é o **cliente de texto**. Palco, câmera e Ao vivo ficam no **aplicativo de PC**. São dois repositórios, **um** código de interface.

| | Repo | Pasta local (exemplo) |
|---|---|---|
| Site / chat / Pages | [agorafoss/agorafoss.github.io](https://github.com/agorafoss/agorafoss.github.io) | `Desktop\Nova pasta` |
| Janela Tauri + instalador | [agorafoss/agora-desktop](https://github.com/agorafoss/agora-desktop) | `Desktop\agora-desktop` |

Não copie a pasta `src/` do site para o desktop. O `.exe` **monta** a UI do site no build. Se duplicar, as duas Ágoras divergem.

O arquivo `docs/MIDIA.md` (se existir neste PC) é nota local e **não** vai para o GitHub.

## O que cada um faz

**Site (browser)**

- Praça, canais de texto, DM, convite, cargos
- Aviso no palco: “isto é no app de PC”
- Sem botão Ao vivo
- Sem pedir JWT ao `groups.0xchat.com`

**App de PC**

- A mesma UI, com `desktop: true`
- Depois: MediaMTX / LiveKit **dentro** do `.exe` (ainda não neste passo)
- Dois desktops: um hospeda, o outro entra (LAN ou Tailscale)
- Sem Docker

## Clonar os dois

```powershell
cd $env:USERPROFILE\Desktop
git clone https://github.com/agorafoss/agorafoss.github.io.git "Nova pasta"
git clone https://github.com/agorafoss/agora-desktop.git agora-desktop
```

Se o site **não** estiver em `..\Nova pasta` relativo ao desktop:

```powershell
$env:AGORA_CLIENT = "C:\Users\User\Desktop\Nova pasta"
```

## Rodar o site (chat)

Node 22+ e [pnpm](https://pnpm.io/).

```powershell
cd "$env:USERPROFILE\Desktop\Nova pasta"
pnpm install
pnpm dev
```

Abre `http://localhost:5173`. Isto **não** transmite vídeo.

## Rodar o app de PC

Precisa de Rust (`rustup`), além do Node/pnpm. O cliente do site já tem de ter `pnpm install`.

```powershell
cd $env:USERPROFILE\Desktop\agora-desktop
pnpm install
pnpm dev
```

Sobe o Vite do **site** e abre a janela Tauri. Instalador: `pnpm build` (NSIS, currentUser).

Deep links `agora:` e `nostr:` entram no instalador. O cadeado ainda é o cofre da web.

## Dois PCs (desk↔desk)

1. Os dois instalam (ou rodam `pnpm dev`) o **agora-desktop**.
2. Chat continua no relay de texto (hoje `groups.0xchat.com`).
3. Quando o sidecar de mídia existir: o PC A hospeda; o cartaz Nostr (`kind 30311`) leva o **IP que o amigo alcança**.
4. **Nunca** coloque `localhost` / `127.0.0.1` nesse cartaz — o browser do amigo tentaria o *próprio* PC.
5. Ordem do IP anunciado: Tailscale `100.x` se existir; senão IPv4 da LAN.
6. O host publica no `127.0.0.1:8889`; o amigo abre `http://<ip-do-A>:8889/live/agora/whep`.

### Tailscale

1. Instale o Tailscale nos dois PCs e entre na mesma tailnet.
2. Anote o IP `100.x` do host (`tailscale ip -4`).
3. Firewall do Windows: permitir a porta **8889** (e, no palco, a do LiveKit) na interface Tailscale.
4. Sem Tailscale: os dois no mesmo Wi-Fi, IP `192.168.` / `10.`.

Portas (quando o sidecar ligar):

| Peça | Porta | Para quê |
|---|---|---|
| MediaMTX WHIP/WHEP | `8889` | Ao vivo |
| MediaMTX HLS | `8888` | fallback |
| LiveKit | `7880` | palco (passo seguinte) |

## O que o site sozinho não faz

- Não tem servidor de voz. `groups.0xchat.com` é NIP-29 de **texto**.
- Não alcança o `localhost:8889` de outra pessoa.
- HTTPS do Pages + `http://` da live = o browser bloqueia (conteúdo misto), mesmo com Tailscale, se um dia o **site** tentar assistir.

Por isso o aviso no palco do Pages não é bug.

## Depois: o site assistir (não implementado)

Para um visitante em `https://agorafoss.github.io` ver a sua live:

1. O ingest continua no seu PC (ou num VPS).
2. Na frente, um **túnel TLS** que o browser aceite:
   - Tailscale Funnel, ou
   - Cloudflare Tunnel, ou
   - VPS com HTTPS (Caddy/nginx) apontando para o WHEP
3. O evento `kind 30311` leva essa URL `https://…/whep`, não `http://100.x:8889`.
4. Sem isso, só outro **app de PC** assiste.

## Relacionado

- Casco e build: [agora-desktop](https://github.com/agorafoss/agora-desktop)
- Recinto e lei: [`HOSPEDAR.md`](./HOSPEDAR.md)
- Cartaz NIP-53: [`GOLIVE.md`](./GOLIVE.md)
- Fases: [`ROADMAP.md`](./ROADMAP.md)
