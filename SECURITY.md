# Segurança

## O que reportar em privado

- Qualquer caminho que vaze `nsec` ou a senha do cofre
- Falha na cifra NIP-44 / NIP-17
- Injeção no renderer (XSS) que rode no contexto do app
- Bypass de cargo NIP-29 no cliente que engane o usuário (o relay é a autoridade)
- WebRTC/LiveKit/MediaMTX puxando mídia pelo SOCKS do Tor (quebraria a promessa dos três planos)

Abra um issue **sem** a prova de conceito se o buraco ainda não estiver fechado, ou mande os detalhes para os maintainers do fork que você estiver usando.

## O que não é bug

- Mensagem pública num canal público ser lida por qualquer um no relay. É o protocolo.
- Relay recusar evento. O relay é o recinto.
- Vídeo não passar pelo Tor. É decisão de arquitetura. Veja o roadmap.
- O servidor de mídia ver o IP de quem transmite ou entra no palco. É o plano 2 e 3.

## Chaves

Quem tem o `nsec` é dono da conta. Perdeu a chave, perdeu a conta. O app avisa isso na criação. Não existe "esqueci a senha".

## Riscos aceitos (anonimato)

Estes não têm solução fácil. Ficam escritos para ninguém achar que “Tor no chat” cobre o resto.

### 1. Correlação de timing entre Tor e mídia

Um observador que vê o relay **e** o MediaMTX (ou que correlaciona timing de rede) liga `kind 30311` publicado às 20:03 com uma conexão WHIP clearnet às 20:03 vinda do IP X. Não precisa decifrar nada. Publicar um Go Live **revela o IP ao servidor de mídia**, mesmo com Tor no texto. O aviso da UI diz isso, não só “Tor não carrega voz nem live”.

Mesmo problema clássico de hidden service + atividade clearnet no mesmo instante.

### 2. ICE / host candidates

Política travada em `src/lib/nostr/ice.ts`:

- `iceTransportPolicy: "all"` — aceitamos host candidates.
- Sem `relay`-only: o Ágora não opera TURN próprio; o SFU já é o relay de mídia.
- Sem STUN público (`stun.l.google.com`): seria um terceiro a mais.
- LiveKit usa o ICE que o próprio servidor anuncia.

O operador do LiveKit/MediaMTX vê o IP. Membros da sala **não** trocam mídia P2P (caminho é o SFU). Quem quiser esconder o IP do *servidor* de mídia não deve entrar no palco nem dar Go Live.

### 3. Metadados de imagem

Upload Blossom passa por `stripImageMetadata` (JPEG APP1/APP13/COM, PNG tEXt/eXIf, WebP EXIF/XMP). GIF e AVIF passam intactos para não quebrar animação. Não é antivírus e não é prova contra steganografia.

### 4. Gift wrap (NIP-17 / NIP-59)

O `created_at` do wrap (kind 1059) usa jitter de até 2 dias (`randomNow` do nostr-tools). O rumor interno fica em `now()`. Sem esse jitter, o relay correlaciona remetente e destinatário pelo relógio mesmo sem ler o conteúdo. Publicar os dois wraps no mesmo instante ainda é um sinal fraco de par — aceito.

### 5. WHEP

WHIP é RFC 9725. WHEP ainda é draft IETF. Está estável na prática (MediaMTX, LiveKit, Cloudflare Stream). Não tratar o wire format como congelado.

### 6. Tor ainda não aplica SOCKS

A tela de circuito grava host/porta e `.onion`. O WebSocket do NDK **ainda não** passa pelo SOCKS (`socksAppliedToNostr() === false`). O checklist humano #6 (texto num `.onion`, voz/live fora do circuito) só vale depois da Fase 7 de verdade.

## Quem hospeda

Rodar relay + LiveKit + MediaMTX + Blossom é recinto. Quem sobe assume a exposição legal da própria jurisdição, a moderação do que passa nas peças e o gargalo de um MediaMTX de nó único. Guia curto: [`docs/HOSPEDAR.md`](./docs/HOSPEDAR.md).
