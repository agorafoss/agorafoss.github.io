# Hospedar um recinto

Isto **não é conselho jurídico**. É o que o código assume quando alguém sobe as peças.

No 0.1 o usuário **não** sobe LiveKit nem MediaMTX. Palco é malha P2P no browser. Chat continua num relay NIP-29 (hoje `groups.0xchat.com`, ou o `wss://` que você colar). Arquivos de imagem costumam ir para um **Blossom** à parte.

Como os relays padrão nasceram, como eles **não** se copiam entre si, e como subir o **seu** NIP-29: [`RELAYS.md`](./RELAYS.md).

Quem quiser um recinto clássico (relay + SFU + ingest 1→N) ainda pode subir **relay NIP-29 + LiveKit + MediaMTX** por conta própria. Não é o caminho do app. O `docker-compose.yml` deste repo é legado de desenvolvimento.

No palco P2P, **cada membro vê o IP dos outros**. Não há um único operador de SFU no meio. A chave de sala privada **não** vai em claro para o relay (só envelope NIP-44). DeepFilterNet 3 corre no PC de cada um.

## O que cada processo vê (0.1)

| Peça | Vê | Não vê |
|---|---|---|
| Relay Nostr | Eventos assinados, IP de quem publica (se não for `.onion`). Envelope cifrado da chave de sala | Texto de DM (NIP-17). Texto privado `agora1.`. Bytes do wasm/modelo de voz |
| Blossom | Bytes do arquivo, IP de quem sobe | Quem leu no chat, a menos que o host cruze logs |
| Pares no palco | IP uns dos outros, áudio/vídeo da malha | Eventos Nostr, a menos que a mesma pessoa cruze as duas pontas |

Se no futuro alguém subir LiveKit ou MediaMTX por conta própria, esses processos vêem IP e mídia. Cruzar o log do relay com o log de mídia desanonimiza. No 0.1 isso **não** é o caminho do app.

## Exposição legal

Na jurisdição de quem hospeda, o operador do recinto costuma ser tratado como quem oferece o serviço — não o cliente Ágora, não a spec NIP-29. Isso inclui:

- Chat público que passou no *seu* relay
- Imagens que passaram no *seu* Blossom
- Voz e webcam que passaram no *seu* LiveKit (se você subir um)
- Transmissão que passou no *seu* MediaMTX (se você subir um)
- No palco P2P do 0.1: cada membro já vê o IP dos outros; não há um SFU seu no meio

O Ágora não tem API nossa, não tem banco na nuvem e não tira isso da sua mão. “Sem empresa no meio” quer dizer que **você** é o recinto.

## Conteúdo ilegal e responsabilidade

Princípio 8: o Ágora não é esconderijo. O cliente **não** implementa filtro automático de conteúdo. Quem hospeda precisa da própria política e das próprias ferramentas:

- Política pública do recinto (o que é expulso)
- Fluxo de denúncia (pelo menos: copiar id do evento + relay e avisar o admin)
- No Blossom/relay: recusar o que a lei local e as regras do recinto proíbem
- Cooperação com a autoridade da jurisdição em que o servidor está

Sem isso, “não é plataforma para crime” é só um cartaz.

## Escala do palco (0.1)

A malha 720p30 **não** é CDN. Dez pessoas com câmera esgotam uplink de casa. Isso é o desenho, não um bug. Teto 10. Quem quiser 1→N para dezenas de espectadores sobe MediaMTX por conta própria — Fase 9, não o botão Ao vivo de agora.

## Tor

Mesmo com o cliente no circuito, **voz e live saem em clearnet**. No palco P2P o IP chega nos *outros membros da sala*, não num SFU. Se a promessa do recinto é “ninguém aqui vê IP”, não ofereça palco.

## Relacionado

- Subir o soquete: [`RELAYS.md`](./RELAYS.md)
- [Armada](https://github.com/soapbox-pub/armada) (Soapbox/Ditto) é outro cliente NIP-29 + LiveKit. O palco Ágora 0.1 **não** pede JWT a esse fluxo. Interoperar texto NIP-29; voz é malha nossa.
