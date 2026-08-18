# Hospedar um recinto

Isto **não é conselho jurídico**. É o que o código assume quando alguém sobe as peças.

Quem sobe um “servidor Ágora” sobe três processos FOSS: **relay NIP-29 + LiveKit + MediaMTX**. Arquivos de imagem costumam ir para um **Blossom** à parte. Cada um vê coisa diferente.

## O que cada processo vê

| Peça | Vê | Não vê |
|---|---|---|
| Relay Nostr | Eventos assinados, IP de quem publica (se não for `.onion`) | Texto de DM (NIP-17). Conteúdo de imagem (só a URL) |
| Blossom | Bytes do arquivo, IP de quem sobe | Quem leu no chat, a menos que o host cruze logs |
| LiveKit | IP de cada participante do palco, áudio/vídeo da sala | Eventos Nostr, a menos que o mesmo admin cruze logs |
| MediaMTX | IP de quem transmite (WHIP) e de quem assiste (WHEP/HLS) | O texto do canal, a menos que o mesmo admin cruze logs |

Cruzar o log do relay com o log do MediaMTX desanonimiza o streamer. Se você opera os dois, você *é* esse observador. Trate os logs como material sensível.

## Exposição legal

Na jurisdição de quem hospeda, o operador do recinto costuma ser tratado como quem oferece o serviço — não o cliente Ágora, não a spec NIP-29. Isso inclui:

- Chat público que passou no *seu* relay
- Imagens que passaram no *seu* Blossom
- Voz e webcam que passaram no *seu* LiveKit
- Transmissão que passou no *seu* MediaMTX

O Ágora não tem API nossa, não tem banco na nuvem e não tira isso da sua mão. “Sem empresa no meio” quer dizer que **você** é o recinto.

## CSAM e exploração

Princípio 8: o Ágora não é esconderijo. O cliente **não** implementa PhotoDNA / hash matching. Quem hospeda precisa da própria política e das próprias ferramentas:

- Política pública do recinto (o que é expulso)
- Fluxo de denúncia (pelo menos: copiar id do evento + relay e avisar o admin)
- No Blossom/relay: recusar upload conhecido, logs de denúncia, cooperação com a lei local
- Lista de hashes da sua escolha — o Ágora não escolhe fornecedor

Sem isso, “não é plataforma pra CSAM” é só um cartaz.

## Escala do Go Live

Um MediaMTX de nó único é gargalo. Serve para uma praça. Não é CDN. Muitos espectadores no mesmo WHIP/WHEP esgotam CPU e uplink do VPS. Não é bloqueador de MVP. É risco operacional: ou você escala o MediaMTX, ou a live cai.

## Tor

Mesmo com o cliente no circuito, **voz e live saem em clearnet para a sua máquina**. O IP do participante chega no LiveKit/MediaMTX. Se a promessa do seu recinto é “ninguém aqui vê IP”, não ofereça palco nem Go Live no mesmo host que o relay.

## Relacionado

[Armada](https://github.com/soapbox-pub/armada) (Soapbox/Ditto) é outro cliente NIP-29 + LiveKit. Vale olhar o fluxo NIP-98 → JWT antes de inventar o nosso do zero, e interoperar em vez de divergir.
