# Como contribuir

1. Leia [`docs/PRINCIPIOS.md`](./docs/PRINCIPIOS.md) e o [`ROADMAP.md`](./ROADMAP.md).
2. Abra uma issue ou descreva a mudança antes de um PR grande.
3. Um passo do roadmap por PR, sempre que der.
4. `pnpm test` e `pnpm lint` passam.
5. UI em `pt-BR` primeiro. Toda string visível sai do dicionário em `src/i18n/`.
6. Não misture os três planos: dados (Nostr/Tor), sala (LiveKit), Go Live (MediaMTX).

## Estilo

- TypeScript strict.
- CSS modules + tokens em `src/styles/tokens.css`. Sem Tailwind.
- Sem blurple do Discord. A cara é rádio de madrugada: carvão, âmbar, papel.

## Segurança

Chave (`nsec`) nunca vai para `localStorage` em texto puro, nunca vai para analytics, nunca vai para o relay sem cifra de DM. Veja `SECURITY.md`.
