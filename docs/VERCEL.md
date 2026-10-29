# Publicação na Vercel

Um projeto Vercel hospeda o frontend Vite em `dist/` e a API Express pela função `api/index.ts`. O banco e o Auth continuam no Supabase. A API executa em São Paulo (`gru1`), com Node 24 e duração máxima de 60 segundos.

Publicação realizada em 29/10/2026: [abrir bolão](https://bolao-flamengo-brasileirao.vercel.app), projeto `niltonmoraesnetos-projects/bolao-flamengo-brasileirao`. O organizador autorizou a CLI e confirmou a aplicação da migration de login. As três variáveis foram cadastradas em Production/Preview sem expor valores. A CLI atribuiu o primeiro deploy a Production automaticamente; uma segunda versão corrigiu a resolução dos imports e foi publicada com `--prod`.

O navegador sempre usa `/api` no domínio atual. No desenvolvimento, o proxy do Vite encaminha essas chamadas para `localhost:3001`. `VITE_API_URL` não é mais usado; não copie o `.env` inteiro para a Vercel.

## Preparar o banco já existente

Aplique **somente** `supabase/migrations/202610290002_login_rate_limit.sql` no SQL Editor do projeto já configurado. Ela cria a contagem de login compartilhada entre instâncias; nenhuma tabela de jogos/palpites é alterada. Não reaplique a estrutura inicial nem a importação histórica.

A RPC pública permite apenas consumir uma tentativa, com limite fixo de 10 por IP em 15 minutos. Não há permissão para consultar, apagar ou reiniciar contadores. A API envia hash do IP; não envia email/senha para essa tabela. Somente na Vercel o endereço vem do header `x-vercel-forwarded-for`, definido pela plataforma; fora dela usa o endereço da conexão. Falha do limitador retorna erro de serviço e impede login até a recuperação.

## Configuração do projeto

No painel, use a raiz do repositório, preset **Vite** e **Node.js 24.x**. O arquivo `vercel.json` define instalação `npm ci`, build `npm run build`, saída `dist`, função da API e fallback das rotas do React Router. Não configure a pasta `server/` como Root Directory.

Cadastre estas variáveis no servidor, em Production e Preview:

| Variável | Valor |
| --- | --- |
| `SUPABASE_URL` | URL do projeto, como no `.env` local |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável, como no `.env` local |
| `ACTIVE_SEASON` | `2026` |

Não use chave `service_role` ou secret key do Supabase. Não adicione prefixo `VITE_` a essas variáveis. `FRONTEND_ORIGIN` e `PORT` não são necessários na Vercel: frontend e API compartilham a origem e a plataforma gerencia a porta. As URLs de Preview também funcionam sem alterar CORS. Preview usa o mesmo banco, portanto uma gravação autenticada ali também é real.

Pela CLI oficial, após `vercel login`, execute `vercel link`, configure as variáveis e publique primeiro com `vercel deploy`. Após conferir, use `vercel deploy --prod` ou promova a versão validada. Os JSONs históricos não são importados pelo frontend/API nem copiados para `dist`. `.vercelignore` exclui histórico e arquivos locais dos uploads da CLI; `.env` e `.vercel` também estão ignorados pelo Git.

## Conferir a publicação

1. `GET /api/health`: 200 com JSON `{"status":"ok"}`. Verifica a função; não comprova conexão com banco.
2. `GET /api/jogos/list` sem sessão: 401 com JSON; nunca HTML do frontend.
3. Abra e atualize `/login`, `/home`, `/palpites` e `/classificacao`: as rotas carregam sem 404 da hospedagem (rotas privadas exigem login).
4. Faça login como administrador; confira os 38 jogos e a classificação. Uma senha incorreta deve exibir erro de credenciais, não erro de roteamento.
5. Confira a inclusão real de um palpite autorizado e recarregue para confirmar persistência. Esse passo ainda exige uma gravação deliberada do organizador.

O vínculo inicial pela CLI conectou o repositório GitHub ao projeto. A publicação desta sessão envia os arquivos locais pela CLI, inclusive mudanças ainda não commitadas. Para que os próximos deploys usem o código atualizado pelo Git, é necessário commitar/enviar a branch e depois integrar à branch de Production configurada no painel. Confira essa configuração antes de enviar commits: `main` ainda pode conter a versão antiga.

Depois de `vercel build`, execute `npm run check:vercel` para inicializar a função realmente gerada e conferir health, bloqueio sem sessão e presença do frontend. Esse teste detecta imports `.ts` preservados indevidamente no JavaScript de produção; `rewriteRelativeImportExtensions` precisa permanecer ativo no `tsconfig.server.json`. O teste usa configuração fictícia e não chama Supabase.

Se uma versão falhar, reverta o deploy no painel ou promova a versão anterior. A reversão do frontend/API não reverte gravações no Supabase. A sessão ainda exige novo login ao expirar; o plano gratuito do Supabase pode pausar por inatividade.

Referências: [Vite e rotas SPA](https://vercel.com/docs/frameworks/frontend/vite), [Node Functions](https://vercel.com/docs/functions/runtimes/node-js), [headers de IP](https://vercel.com/docs/headers/request-headers).
