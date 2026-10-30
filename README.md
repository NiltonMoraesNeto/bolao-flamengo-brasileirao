# Bolão do Flamengo

Gestão do bolão de amigos com um único administrador. React, TypeScript, Tailwind e shadcn/ui, com TanStack Form/Zod e TanStack Query; API Node 24/Express/TypeScript; PostgreSQL e Auth no Supabase.

A aplicação está publicada em [bolao-flamengo-brasileirao.vercel.app](https://bolao-flamengo-brasileirao.vercel.app), com frontend e API Node na Vercel e banco/Auth no Supabase. O organizador confirmou o login na publicação; os 38 jogos e a classificação dos 12 participantes de 2026 foram conferidos online. Rotas, proteção da API e integração de login também foram verificadas com credencial fictícia. Para configurar outro ambiente, consulte [o guia Supabase](docs/SUPABASE.md).

## Desenvolvimento

```bash
nvm use
npm ci
cp .env.example .env
```

Configure `.env`. Execute `npm start` e `npm run dev` em terminais separados e abra [o login](http://localhost:5173/login). A conta agora vem do Supabase Auth; credenciais antigas do JSON não são importadas.

## Verificação e importação

- `npm run check`: lint, tipos da API, testes e build.
- `npm run db:prepare-import`: valida os JSONs e gera `.local/import-legacy.sql`, sem alterar os originais ou escrever na nuvem.

Testes usam PostgreSQL embarcado (PGlite) e gateway Auth simulado. Os testes HTTP abrem uma porta temporária no localhost. Não precisam de Supabase ou dados reais.

## Documentação

- [Diagnóstico e prioridades](docs/REVIEW.md)
- [Especificação e etapas](docs/SPEC.md)
- [Harness e validação](docs/HARNESS.md)
- [Configuração e migração Supabase](docs/SUPABASE.md)
- [Publicação do frontend e API na Vercel](docs/VERCEL.md)

Grade em lote com conferência, consulta dos jogos encerrados, navegação móvel, temas claro/escuro e publicação na Vercel estão implementados. Leitura de prints e renovação automática de sessão ficam para as próximas etapas. Novas publicações seguem o fluxo de commit/push e PR para `main`, conectado à Vercel.

A página **Simulação** (`/simulacao`) permite escolher um jogo futuro, carregar/alterar/adicionar palpites temporários e informar um resultado hipotético para abrir a classificação em um Dialog. Tudo é calculado no navegador; palpites, resultados e classificação oficiais permanecem intactos. A entrega local de 30/10/2026 está na branch `codex/simulacao-classificacao`, aguardando commit/push e PR para publicação. O bloqueio oficial dos jogos requer aplicar a migration `202610300003_lock_finished_games.sql` no Supabase.
