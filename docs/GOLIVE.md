# Go Live — MediaMTX

A mídia **não** passa no Nostr e **não** passa no Tor.

Publicar um Go Live **revela o IP do streamer ao MediaMTX**, mesmo que o chat esteja no circuito. Um observador que vê o relay e o servidor de mídia correlaciona o `kind 30311` com a conexão WHIP pelo relógio. O cliente avisa isso antes de transmitir.

```bash
docker compose up
```

No Ágora, o botão de transmissão publica no WHIP padrão:

- ingestão: `http://localhost:8889/live/agora/whip`
- playback: `http://localhost:8889/live/agora/whep`

O anúncio da live é um evento NIP-53 (`kind 30311`) com a URL `streaming`. O chat da live continua no canal NIP-29.

OBS pode publicar no mesmo WHIP. O Ágora só assiste.
