# Go Live

A mídia **não** passa no Nostr e **não** passa no Tor.

O botão Ao vivo existe no **app de PC**. O site (Pages) é chat: não publica WHIP. Guia dos dois repos: [`DESKTOP.md`](./DESKTOP.md).

Publicar um Go Live **revela o IP do streamer ao servidor de mídia**, mesmo que o chat esteja no circuito. Um observador que vê o relay e o host de mídia correlaciona o `kind 30311` com a conexão WHIP pelo relógio. O cliente avisa isso antes de transmitir.

## No app de PC (caminho do usuário)

O `.exe` vai hospedar o MediaMTX **dentro** da janela (sidecar). Sem Docker. Dois desktops: o host publica no `127.0.0.1:8889`; o cartaz Nostr leva o IP que o **amigo** alcança (Tailscale `100.x` ou LAN). Nunca `localhost` no evento.

Repositório do casco: [agorafoss/agora-desktop](https://github.com/agorafoss/agora-desktop).

## Cartaz Nostr

O anúncio é um evento NIP-53 (`kind 30311`) com a URL `streaming` (WHEP). O chat da live continua no canal NIP-29.

Portas do MediaMTX (iguais no sidecar e no compose de desenvolvimento):

- ingestão: `http://<host>:8889/live/agora/whip`
- playback: `http://<host>:8889/live/agora/whep`

OBS pode publicar no mesmo WHIP. O Ágora assiste via WHEP.

## Desenvolvimento (opcional)

`docker compose up` neste repo do **site** ainda sobe um MediaMTX solto para quem está debugando o cliente sem o `.exe`. Não é o que pedimos ao usuário final.

```bash
docker compose up
```

Só no mesmo PC: `http://localhost:8889/live/agora/whip`. O amigo na internet **não** alcança isso.
