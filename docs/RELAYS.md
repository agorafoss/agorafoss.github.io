# Relays

Isto ensina o que o Ágora faz com relays, **como eles se falam** (quase não se falam), de onde vêm os endereços padrão, e como subir o **seu**. Não é conselho jurídico. Quem hospeda é o recinto: [`HOSPEDAR.md`](./HOSPEDAR.md).

O Ágora **não** opera relay. Os endereços abaixo são de outras pessoas. Você pode tirá-los da lista e colar o seu.

## O que um relay é

Um relay Nostr é um servidor WebSocket (`ws://` ou `wss://`). O cliente manda um evento **já assinado** com a sua chave. O relay guarda e entrega a quem pedir. Ele não é o dono da conta. Quem tem as 12 palavras é o dono.

O protocolo está em [NIP-01](https://nips.nostr.com/01). Cada relay publica o que aceita em [NIP-11](https://nips.nostr.com/11):

```bash
curl -sL -H "Accept: application/nostr+json" https://relay.damus.io
```

O campo `software` diz o programa. `supported_nips` diz o que passa e o que é recusado.

## Relays **não** formam uma rede entre si

Não existe um backbone. Relays **não** copiam eventos uns dos outros por omissão.

O que parece “a rede Nostr” é o **cliente** falando com vários ao mesmo tempo:

```
seu PC ──EVENT──► relay A
        ──EVENT──► relay B
        ──REQ───► relay C
```

Se A tem a sua nota e B não, B **não** pede a A. Quem quiser a nota em B tem de publicar de novo em B (ou um operador configurar sync — [NIP-77](https://nips.nostr.com/77) / [strfry sync](https://github.com/hoytech/strfry) — por conta própria).

Consequência para a praça: o grupo NIP-29 **mora num relay**. `#geral` em `wss://groups.0xchat.com` **não** aparece em `wss://relay.damus.io`. Convidar alguém é mandar o id + o `wss://` daquele relay, não “está no Nostr”.

## Dois papéis no Ágora

| Papel | O que carrega | Onde no 0.1 |
|---|---|---|
| Lista aberta | Perfil `kind 0`, DMs embrulhadas (NIP-17), mute, emparelhar | Ajustes → Relays. Começa com Damus, nos.lol, Primal, purplepag.es + os dois de grupo |
| Relay da praça | Tudo do grupo: criar, entrar, canais, cargos, mensagens com tag `h` | O `wss://` que você cola ao **criar** ou **entrar**. Tem de falar [NIP-29](https://nips.nostr.com/29) |

Um strfry genérico (Damus, nos.lol) **recusa** `kind 9007` / tag `h` de grupo, ou ignora as regras. Sem NIP-29 **não há praça**.

Palco (voz/vídeo) **não** passa no relay. O relay só vê signaling Nostr da malha, se o cliente publicar lá. Mídia é WebRTC entre os browsers. [`GOLIVE.md`](./GOLIVE.md).

No 0.1 o cliente **ainda cola** `wss://groups.fiatjaf.com` e `wss://groups.0xchat.com` no pool do NDK, mesmo se você os tirar da lista. A praça que você criou no *seu* `wss://` continua só nele. Perfil e DM seguem a lista de ajustes.

Arquivo (foto no chat) vai para um **Blossom** (`https://blossom.primal.net` no 0.1), não para o relay.

## Os relays padrão — o que são e como nasceram

Metadados abaixo vêm do NIP-11 público de cada um (agosto 2026). Operação interna (VPS, firewall, política anti-spam) é de quem hospeda. O Ágora não tem o runbook deles.

### Relays de dados (lista aberta)

| Endereço | Nome NIP-11 | Software | O que é | Como se “cria” um igual |
|---|---|---|---|---|
| `wss://relay.damus.io` | damus.io | [strfry](https://github.com/hoytech/strfry) 1.1 | Relay geral da app Damus. Notas, perfil, muito tráfego. Rate-limit agressivo. | Compilar strfry, `strfry setup`, TLS na frente (Caddy/nginx). NIP-11 deles: “Damus strfry relay”. |
| `wss://nos.lol` | nos.lol | [strfry](https://github.com/hoytech/strfry) 1.1 | Relay geral comunitário. Aceita notas, recusa spam. | O mesmo strfry. Política escrita à parte (eles apontam um wiki). |
| `wss://relay.primal.net` | Primal Public Relay | [strfry](https://github.com/hoytech/strfry) ~1.0.3 | Porta pública do Primal. O app Primal também tem um **cache** próprio ([primal-server](https://github.com/PrimalHQ/primal-server)) que **não** é este WebSocket. | strfry para o `wss://`. O cache Primal é outro processo, outro produto. |
| `wss://purplepag.es` | purplepag.es | [purplepag.es](https://github.com/pablof7z/purplepag.es) (Pablo / f7z) | **Não** é chat. Indexa perfil, listas, metadados ([NIP-51](https://nips.nostr.com/51), [NIP-65](https://nips.nostr.com/65)). Recusa kinds que não servem a isso — inclusive signaling de palco. | Não copie isto para ter uma praça. É um diretório. |

### Relays de praça (NIP-29)

| Endereço | Nome NIP-11 | Software | O que é | Como se “cria” um igual |
|---|---|---|---|---|
| `wss://groups.0xchat.com` | 0xchat Groups relay | [khatru](https://github.com/fiatjaf/khatru) + NIP-29 | **Onde o Ágora cria praça por omissão.** Aceita `kind 9007` do cliente. Operado pelo [0xchat](https://0xchat.com/). Fork público: [0xchat-app/relay29](https://github.com/0xchat-app/relay29). | Khatru + biblioteca [relay29](https://github.com/fiatjaf/relay29) (`khatru29.Init`). TLS. Política de grupo no próprio relay. |
| `wss://groups.fiatjaf.com` | groups | [khatru](https://github.com/fiatjaf/khatru) + NIP-29 | Relay de teste do autor da spec. **Recusa criar grupo pelo cliente** (`9007`). A UI deles: [groups.fiatjaf.com](https://groups.fiatjaf.com). O código de exemplo está em `examples/groups.fiatjaf.com` no repo relay29. | Mesmo stack. No Ágora: crie no site deles e **entre** com o id, ou use outro `wss://`. |

Os dois anunciam NIPs `1, 11, 40, 42, 70, 86, 29, 9`. Sem o `29` na lista, não serve de praça.

`relay29` no GitHub do fiatjaf foi **arquivado em 2026-04-20**. O binário que roda hoje (0xchat, groups.fiatjaf.com) ainda é esse desenho. Alternativas ativas: [max21dev/groups-relay](https://github.com/max21dev/groups-relay), [verse-pbc/groups_relay](https://github.com/verse-pbc/groups_relay) (Rust).

## Como os eventos se espalham no Ágora

1. Você publica o perfil (`kind 0`). O cliente manda para **todos** os `wss://` da lista de ajustes (e os dois de grupo colados no pool).
2. Você manda uma mensagem no `#geral`. O cliente manda **só** para o relay daquela praça, com tag `h` = id do grupo. Damus nunca vê isso.
3. Você emparelha outro aparelho. O código curto viaja pelos relays da lista, não pelo palco.
4. DM NIP-17: gift wrap em vários relays da lista. O texto só abre com as chaves. O operador vê envelope e o seu IP.
5. Palco: SDP/ICE entre pares. O signaling Trystero usa kinds `20xxx` **sem** tag `h`. Por isso o cliente **não** manda isso para Damus, purplepag.es nem relays de grupo (fiatjaf/0xchat) — eles recusam e enchiam o F12. Signaling vai para `nos.lol`, `relay.primal.net` e `offchain.pub`. A mídia continua WebRTC direto.

Não há “o relay Damus avisa o 0xchat”. Se os dois têm o seu perfil, é porque o **cliente** publicou nos dois.

## Subir o seu relay de praça (o que importa)

Objetivo: `wss://groups.seudominio.tld` falando NIP-29, para criar a praça **nele** e não depender do 0xchat.

### O que você precisa

- Um VPS com IP público (ou um hostname Tailscale + HTTPS).
- Um domínio apontando para o VPS (Let's Encrypt). `ws://IP:porta` no Ágora funciona na LAN; na internet o browser quer `wss://`.
- Go (khatru) **ou** o binário de um groups-relay pronto.
- [Caddy](https://caddyserver.com/) ou nginx na frente, porta 443.
- Política escrita: o que você apaga, como denunciam, lei do sítio. Sem isso você só tem um soquete aberto. [`HOSPEDAR.md`](./HOSPEDAR.md).

Não precisa de LiveKit, MediaMTX, Docker do Ágora, nem do `.exe`.

### Caminho A — o mesmo desenho dos relays de grupo do 0.1

[Khatru](https://github.com/fiatjaf/khatru) + [khatru29](https://pkg.go.dev/github.com/fiatjaf/relay29/khatru29). Guia passo a passo (exemplo `groups.fiatjaf.com`): [Relay Runner — Khatru29](https://relayrunner.org/relays/khatru29/introduction/).

Esqueleto:

```go
relay, state := khatru29.Init(relay29.Options{
    Domain: "groups.seudominio.tld",
    DB:     db,
})
_ = state
log.Fatal(http.ListenAndServe("127.0.0.1:5577", relay))
```

Pronto para copiar e adaptar: [max21dev/groups-relay](https://github.com/max21dev/groups-relay) (MIT, Khatru + relay29).

### Caminho B — strfry só de notas

Se você quer um Damus/nos.lol **seu** (perfil, DM wrap, backup de kind 0), não uma praça:

1. <https://github.com/hoytech/strfry> — compilação e `strfry.conf`.
2. `strfry setup` cria o LMDB.
3. systemd + Caddy no `wss://`.
4. No Ágora: Ajustes → Relays → somar esse `wss://`. **Não** cole isto no campo “relay” ao criar praça, a menos que você tenha ligado o plugin [strfry29](https://github.com/fiatjaf/relay29/tree/master/strfry29) e testado `kind 9007`.

### TLS (os dois caminhos)

Caddy, com o DNS já no VPS:

```
groups.seudominio.tld {
    reverse_proxy 127.0.0.1:5577
}
```

Caddy sobe HTTPS e o upgrade WebSocket sozinho. Sem isto o Ágora no Pages (`https://agorafoss.github.io`) **não** abre `ws://` misturado.

Confira:

```bash
curl -sL -H "Accept: application/nostr+json" https://groups.seudominio.tld
```

Tem de listar `29` em `supported_nips`.

### Ligar no Ágora

1. Ajustes → Relays → **Somar** `wss://groups.seudominio.tld`.
2. Criar praça → campo relay = **esse** `wss://` (não `groups.fiatjaf.com`).
3. Convite: o `naddr` / `agora:` já leva o relay. Quem entra cola o mesmo endereço.
4. Outro cliente NIP-29 (0xchat, Groups, Nostrord) vê a mesma praça **se** apontar para o mesmo `wss://`.

Se o create falhar com “blocked” / “not enough relays”: o soquete não é NIP-29, ou a política recusa `9007` (caso fiatjaf).

## O que o seu relay vê

| Vê | Não vê |
|---|---|
| Eventos assinados, IP de quem publica | Texto de DM NIP-17 |
| Membros, cargos, mensagens públicas da praça | Áudio/vídeo do palco |
| Envelope NIP-44 da chave de sala privada | A chave em claro |
| Signaling Nostr da malha, se aceitar o kind | Os bytes DeepFilterNet 3 |

Você pode kickar, apagar, recusar kind, fechar o soquete. Você **não** apaga a conta Nostr de ninguém (a chave é dela).

`.onion`: o setting Tor do Ágora ainda **não** aplica SOCKS no WebSocket. Um relay onion no 0.1 não entra no circuito. Fase 7.

## O que isto não resolve

- Não torna o palco anônimo.
- Não replica a praça para Damus.
- Não é CDN de live.
- Não substitui Blossom.
- Não é o sidecar de relay do app de PC (isso ainda não existe).

---

# Relays (English)

Ágora does **not** run a relay. The default URLs belong to other operators. You can remove them and paste yours.

Relays do **not** gossip. The client fans events out. A NIP-29 square **lives on one relay**. `#geral` on `groups.0xchat.com` never appears on `relay.damus.io`.

**Open list** (kind 0, gift-wrapped DMs): Damus, nos.lol, Primal, purplepag.es — mostly [strfry](https://github.com/hoytech/strfry). purplepag.es is a profile/list indexer, not chat.

**Square relay** (NIP-29): default create is `wss://groups.0xchat.com` (khatru). `wss://groups.fiatjaf.com` is the spec author’s test relay and **refuses** client-side `kind 9007` — create on their website. Same stack: [khatru](https://github.com/fiatjaf/khatru) + [relay29](https://github.com/fiatjaf/relay29) (`khatru29.Init`). NIP-11 `software` is how we know; we do not have their private runbooks.

To host **your** square: VPS + domain + TLS + a NIP-29 binary ([groups-relay](https://github.com/max21dev/groups-relay) or the [Khatru29 guide](https://relayrunner.org/relays/khatru29/introduction/)). In Ágora, put that `wss://` in the create-square field. Check `29` in NIP-11.

In 0.1 the NDK pool still also connects to the two public group relays. Your square’s events still only go to the relay you created it on. Voice never goes through the relay. Legal: [`HOSPEDAR.md`](./HOSPEDAR.md).
