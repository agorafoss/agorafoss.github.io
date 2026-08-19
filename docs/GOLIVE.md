# Palco e Ao vivo

A mídia **não** passa no Nostr e **não** passa no Tor.

No 0.1 o palco e o Ao vivo são a **mesma malha P2P** ([Trystero](https://trystero.dev) + signaling Nostr). Sem LiveKit. Sem MediaMTX. Sem WHIP/WHEP. Sem sidecar. O site e o `.exe` usam o mesmo código.

## Qualidade

Captura **1280×720 a 30 fps**. Encoder alvo ~2,5 Mbps por cópia. Sem downgrade automático para 360p.

Cada participante **manda uma cópia para cada outro**. Isso é o preço da malha.

| Sala | Upload aproximado de quem transmite vídeo |
|---|---|
| 2 pessoas | ~2,5 Mbps |
| 5 pessoas | ~10 Mbps |
| 10 pessoas | ~18–22 Mbps |

Várias câmeras ao mesmo tempo: cada um paga isso. Em internet de casa, **ninguém consegue ver** — travamento, áudio cortando, tile preto. Está escrito na UI. Não é bug escondido.

Teto: **10 pessoas**. O 11º não entra.

O palco **sempre abre em voz**. Câmera, tela e o botão Ao vivo são opção no mesmo mesh. Quem está falando aparece na lista (VU).

## Salas privadas

Trystero cifra o SDP com uma senha. No Ágora essa senha **não** é um texto que você escolhe e o relay guarda.

Na criação: chave aleatória, mostrada **uma vez** (“copia, manda no DM”). O relay só vê envelopes NIP-44 (`kind 30078`, `agora-rk:<sala>:<destinatário>`). Quem tem as 12 palavras recupera a chave neste PC. Canal de texto privado usa a mesma chave (`agora1.` AES-GCM). Apagar o canal (texto ou palco) é ação de cargo no NIP-29 (`9008`).

## Limpar voz

DeepFilterNet 3 no microfone **deste** PC. Wasm + modelo (~24 MB) em `/deepfilternet3/` nesta origem. Não passa no relay. Cada um configura o seu (ajustes → voz). Se o modelo não carregar, o palco segue com `noiseSuppression` do browser.

Licenças do modelo: Apache-2.0 OR MIT ([NOTICE](../public/deepfilternet3/NOTICE.txt)).

## O que o palco revela

Os outros na sala vêem o **seu IP**. Sem TURN: CGNAT e celular muitas vezes não conectam. Caminho que costuma funcionar: mesma LAN ou Tailscale.

Tor do chat **não** cobre isto.

## O que isto não é

- Não é live pública 1→N para dezenas de espectadores.
- Não publica `kind 30311` com URL WHEP falsa.
- Outro cliente Nostr (zap.stream, Nostrord) **não** assiste.
- MediaMTX / LiveKit ficam fora do caminho do usuário neste ciclo.

## App de PC

O [agora-desktop](https://github.com/agorafoss/agora-desktop) é a mesma UI numa janela. Não precisa do `.exe` para o palco abrir.

`docker compose` com MediaMTX neste repo é só legado de desenvolvimento. Não é o caminho do 0.1.
