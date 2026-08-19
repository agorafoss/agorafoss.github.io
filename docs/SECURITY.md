# Segurança

## O que reportar em privado

- Qualquer caminho que vaze `nsec` ou a senha do cofre
- Falha na cifra NIP-44 / NIP-17
- Injeção no renderer (XSS) que rode no contexto do app
- Bypass de cargo NIP-29 no cliente que engane o usuário (o relay é a autoridade)
- WebRTC/Trystero puxando mídia pelo SOCKS do Tor (quebraria a promessa dos três planos)
- Envelope NIP-44 da chave de sala (`agora-rk:`) decifrado por quem não é o destinatário

Abra um issue **sem** a prova de conceito se o buraco ainda não estiver fechado, ou mande os detalhes para os maintainers do fork que você estiver usando.

## O que não é bug

- Mensagem pública num canal público ser lida por qualquer um no relay. É o protocolo.
- Relay recusar evento. O relay é o recinto.
- Vídeo não passar pelo Tor. É decisão de arquitetura. Veja o roadmap.
- Os outros no palco verem o seu IP. É a malha P2P. Sem TURN, sem SFU no 0.1.

## Chaves

Quem tem o `nsec` é dono da conta. Perdeu a chave, perdeu a conta. O app avisa isso na criação. Não existe "esqueci a senha".

## Riscos aceitos (anonimato)

Estes não têm solução fácil. Ficam escritos para ninguém achar que “Tor no chat” cobre o resto.

### 1. Correlação de timing entre Tor e mídia

Um observador que vê o relay **e** a malha WebRTC (ou que correlaciona timing de rede) liga um handshake de palco às 20:03 com ICE clearnet às 20:03 vindo do IP X. Não precisa decifrar nada. Entrar no palco **revela o IP aos pares**, mesmo com Tor no texto. O aviso da UI diz isso.

Mesmo problema clássico de hidden service + atividade clearnet no mesmo instante.

### 2. ICE / host candidates

Política travada em `src/lib/nostr/ice.ts`:

- `iceTransportPolicy: "all"` — aceitamos host candidates. Os pares se vêem.
- Sem TURN neste ciclo. CGNAT e celular muitas vezes não conectam.
- Um STUN: `stun:stun.cloudflare.com:3478`. Sem `stun.l.google.com`.
- Sem SFU. A mídia vai de browser a browser (Trystero).

Quem quiser esconder o IP dos outros na sala **não deve entrar no palco**.

### 3. Metadados de imagem

Upload Blossom passa por `stripImageMetadata` (JPEG APP1/APP13/COM, PNG tEXt/eXIf, WebP EXIF/XMP). GIF e AVIF passam intactos para não quebrar animação. Não é antivírus e não é prova contra steganografia.

### 4. Gift wrap (NIP-17 / NIP-59)

O `created_at` do wrap (kind 1059) usa jitter de até 2 dias (`randomNow` do nostr-tools). O rumor interno fica em `now()`. Sem esse jitter, o relay correlaciona remetente e destinatário pelo relógio mesmo sem ler o conteúdo. Publicar os dois wraps no mesmo instante ainda é um sinal fraco de par — aceito.

### 5. Chave de sala privada

A chave aleatória é mostrada uma vez no cliente. O relay só guarda envelope NIP-44 (`kind 30078`). Quem tem o `nsec` (as 12 palavras) recupera. Quem só copiou a chave e limpou o cache, sem as 12 palavras, perde a sala. Texto privado (`agora1.`) cai no mesmo segredo. Não é DM NIP-17; é sala.

### 6. DeepFilterNet 3

Wasm e modelo ficam em `public/deepfilternet3/` nesta origem. Não buscar `cdn.mezon.ai` (CORS). O áudio processado não sai do PC até o WebRTC do palco.

### 7. Tor ainda não aplica SOCKS

A tela de circuito grava host/porta e `.onion`. O WebSocket do NDK **ainda não** passa pelo SOCKS (`socksAppliedToNostr() === false`). O checklist humano #6 (texto num `.onion`, voz/live fora do circuito) só vale depois da Fase 7 de verdade.

## Quem hospeda

Rodar relay + Blossom é recinto no 0.1. LiveKit/MediaMTX só se alguém subir por conta própria — não é o caminho do app. Palco P2P: cada membro vê o IP dos outros. Guia curto: [`HOSPEDAR.md`](./HOSPEDAR.md).
