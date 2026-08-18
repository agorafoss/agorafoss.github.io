# Como contribuir

Obrigado por querer ajudar. O Ágora é um cliente, não uma plataforma. Leia isto antes de um PR grande.

## Antes de escrever código

1. [`docs/PRINCIPIOS.md`](./docs/PRINCIPIOS.md) — o que o projeto é e o que recusa.
2. [`ROADMAP.md`](./ROADMAP.md) — o que já existe e o que vem depois. Um passo do mapa por PR, sempre que der.
3. Abra uma issue e descreva a mudança se ela cruzar mais de um ficheiro ou um plano de transporte.

Não misture os planos: eventos Nostr (e Tor), sala LiveKit, Go Live MediaMTX. Tor nunca carrega voz nem vídeo.

## Ambiente

Node 22+ e [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
```

A interface visível sai de `src/i18n/pt-BR.json` (e do `en.json` em paralelo). Toda string nova entra nos dois.

## O que um PR precisa

- Testes e lint a passar.
- TypeScript strict, sem `any` novo.
- CSS modules e tokens em `src/styles/tokens.css`. Sem Tailwind. A cara é carvão, âmbar e papel.
- Sem `nsec`, cadeado ou frase-semente no código, no `localStorage` em claro, ou em log.

Chave só no cofre (PBKDF2 + AES-GCM) ou na extensão NIP-07. Detalhe: [`SECURITY.md`](./SECURITY.md).

## O que não entra num PR “de passagem”

Tor no WebSocket (Fase 7), keystore nativo, catálogo OpenMoji inteiro no repo, filtro automático de conteúdo. Cada um tem o próprio passo no roadmap.
