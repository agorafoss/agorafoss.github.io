# Como a praça funciona

Mapa da plataforma. Sem marketing. A conta é uma chave. A praça mora num relay. O palco é malha entre browsers.

A mesma leitura, no estilo da Ágora, abre no site: `#docs` (branch `0.2`). Esta pasta (`docs/`) é o texto no GitHub.

## Três segredos

| Segredo | Para quê | Onde vive |
|---|---|---|
| **12 palavras** | A conta. Mesmo `AG-XXXX`, mesmas DMs, mesmos envelopes de sala. | Na sua cabeça / papel. Nunca no relay. |
| **Cadeado** (8 caracteres) | Destrancar **este** browser. Não é a conta. | Só neste PC. |
| **Chave de sala** (`4E66K-…`) | **Aquela** sala privada. Não é a conta. | Mostrada uma vez. Copia, manda no DM. Envelope NIP-44 no relay. |

As 12 palavras nascem na criação do indicativo. A tela “Copia esta chave” **não** são as 12 palavras — é a senha da sala. Quem tem as palavras abre o envelope noutro PC. Quem só recebeu o código no DM cola na porta.

Perdeu as 12 palavras: perdeu a conta. Não existe “esqueci a senha”. Se alguém pedir as palavras em issue, é golpe.

Detalhe de salas: o relay não guarda o código em claro. Limpar o site sem as palavras some a conta; a sala só volta com o código copiado ou com o envelope + as palavras.

## O que é

Cliente de comunidades. Sem API nossa, sem banco na nuvem. Relays Nostr que você escolhe. Quem hospeda o soquete é o recinto.

- Chat, praça, canais, cargos: [NIP-29](https://nips.nostr.com/29).
- DM: NIP-17 / NIP-44. Terceiro no relay não lê o texto.
- Palco: malha P2P. Ver [`GOLIVE.md`](./GOLIVE.md).
- Arquivo: Blossom. O relay só vê a URL.

Não é clone de outro app. Não é vídeo anônimo. Não é esconderijo.

## Praça e canais

A praça mora **num** `wss://`. Relays não se copiam. `#geral` no 0xchat não aparece no Damus.

Criar: padrão `wss://groups.0xchat.com`. `groups.fiatjaf.com` recusa `kind 9007` no cliente. Entrar: id + o mesmo relay, ou convite `agora:` / `nostr:` / `naddr`.

Cargos NIP-29: kick, apagar, pin, canal. Mute/block no cliente só na sua tela.

## Palco

Sempre abre em voz. Câmera e tela são botões à parte. Sem mic a sala ainda entra; **Falar** tenta o mic de novo. Câmera não pede mic.

720p30. Cada um manda uma cópia para cada outro. Teto 10. Os pares vêem o seu IP. Sem TURN. Tor não cobre isto. DeepFilterNet 3 neste PC.

## Relays

Relays não formam uma rede. O cliente publica em vários. Praça precisa de NIP-29; strfry tipo Damus não serve.

Lista e como subir o seu: [`RELAYS.md`](./RELAYS.md). Recinto e lei: [`HOSPEDAR.md`](./HOSPEDAR.md).

## Tor e desktop

Tor: caminho dos eventos, ainda sem SOCKS no NDK (Fase 7). Nunca voz. [`SECURITY.md`](./SECURITY.md).

App de PC: mesma UI, repo [agora-desktop](https://github.com/agorafoss/agora-desktop). [`DESKTOP.md`](./DESKTOP.md).

## O que isto não é

Não desliga a praça de ninguém. Não é live 1→N. Não filtra conteúdo. Não recupera 12 palavras. Não guarda senha de sala em claro no relay.

Código AGPL-3.0. Palco e stream na branch `0.2`. O site público em `main` continua 0.1 até vocês misturarem.
