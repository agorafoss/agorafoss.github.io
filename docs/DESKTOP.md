# App de PC

O site ([agorafoss.github.io](https://agorafoss.github.io/)) e o **aplicativo de PC** são a **mesma UI**. Palco P2P (Trystero) abre nos dois. São dois repositórios, **um** código de interface.

| | Repo | Pasta local (exemplo) |
|---|---|---|
| Site / chat / Pages | [agorafoss/agorafoss.github.io](https://github.com/agorafoss/agorafoss.github.io) | `Desktop\Nova pasta` |
| Janela Tauri + instalador | [agorafoss/agora-desktop](https://github.com/agorafoss/agora-desktop) | `Desktop\agora-desktop` |

Não copie a pasta `src/` do site para o desktop. O `.exe` **monta** a UI do site no build. Se duplicar, as duas Ágoras divergem.

O arquivo `docs/MIDIA.md` (se existir neste PC) é nota local e **não** vai para o GitHub.

## O que cada um faz

**Site (browser)**

- Praça, canais de texto, DM, convite, cargos
- Palco e Ao vivo em malha P2P (720p30, até 10 pessoas)
- Salas privadas (chave uma vez + envelope NIP-44)
- DeepFilterNet 3 no mic deste PC
- Sem JWT no 0xchat. Sem MediaMTX

**App de PC**

- A mesma UI, com `desktop: true`
- O palco é o do site — não precisa de sidecar neste ciclo
- Sem Docker. Sem LiveKit. Sem MediaMTX no 0.1

Se o palco não conectar: mesma LAN ou Tailscale. Sem TURN. Os pares vêem o IP uns dos outros. 720p30 nesta malha pode ficar imassistível — ver [`GOLIVE.md`](./GOLIVE.md).

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

No 0.1 **não** há host de mídia. Os dois abrem o site ou o `.exe`, entram na mesma praça, entram no mesmo palco. A malha liga os browsers.

1. Os dois rodam o site (`pnpm dev`) ou o **agora-desktop**.
2. Chat continua no relay de texto (hoje `groups.0xchat.com`).
3. Palco: mesma LAN ou Tailscale. Sem TURN, CGNAT/celular muitas vezes falha.
4. Os pares vêem o IP uns dos outros. Não existe `localhost` no cartaz — não há cartaz WHEP.

### Tailscale

Ajuda o WebRTC a furar NAT (IPs `100.x` na mesma tailnet). Não substitui TURN. Sem Tailscale: os dois no mesmo Wi-Fi.

Sidecar MediaMTX/LiveKit **não** faz parte do 0.1. Se voltar, será passo próprio no [roadmap](./ROADMAP.md) (Fase 9), não o caminho do palco atual.

## O que o palco não faz

- Não escala para dezenas de espectadores (malha 720p30).
- Não atravessa NAT difícil sem TURN — mesma LAN ou Tailscale.
- Não é assistível noutro cliente Nostr (sem WHEP).
- `groups.0xchat.com` continua só **texto** no plano de dados.

## Relacionado

- Casco e build: [agora-desktop](https://github.com/agorafoss/agora-desktop)
- Recinto e lei: [`HOSPEDAR.md`](./HOSPEDAR.md)
- Palco: [`GOLIVE.md`](./GOLIVE.md)
- Fases: [`ROADMAP.md`](./ROADMAP.md)
