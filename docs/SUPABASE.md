# Configurar Supabase e API Node

Em 29/10/2026, o organizador criou e configurou o projeto remoto seguindo este guia e confirmou a aplicação da estrutura, autorização do administrador e importação. A aplicação local já está conectada; login e leituras de 2026 foram verificados. Os JSONs originais foram preservados. As instruções abaixo servem também para configurar outro ambiente; não reaplique a estrutura ou a importação no projeto já configurado.

## Projeto e acesso

1. Crie um projeto dedicado no Supabase.
2. No SQL Editor, aplique supabase/migrations/202610290001_initial.sql em um projeto novo. Não reaplique manualmente a mesma migration.
3. Em Authentication, desabilite cadastros públicos e crie seu usuário com uma senha nova.
4. Copie o UUID de Authentication e autorize-o no SQL Editor:

```sql
insert into public.admins (user_id)
values ('UUID-DO-SEU-USUARIO');
```

A tabela permite apenas um administrador. Participantes não precisam de conta. Opcionalmente, configure nome em user_metadata para a saudação; metadados não concedem permissão.

## Histórico

Execute npm run db:prepare-import. Revise e aplique .local/import-legacy.sql no SQL Editor após a estrutura, em um banco vazio. As duas temporadas são importadas na mesma transação. Reaplicação é recusada por duplicidade; não é sincronização.

Esperado: 2026 com 12 participantes, 38 jogos, 384 palpites e 32 resultados; 2025 com 12 participantes, 38 jogos, 456 palpites e 38 resultados. IDs de jogo/participante são preservados por temporada; palpites recebem prefixo do ano. Login, senha, CEP e perfil não são exportados. O arquivo gerado contém nomes e palpites privados e fica ignorado pelo Git.

Datas sem offset são interpretadas como UTC−03:00 (São Paulo em 2025/2026) e convertidas para UTC. Confirme essa suposição antes da importação definitiva.

```sql
select season_id, count(*) from public.predictions group by season_id;
select season_id, count(*) from public.games group by season_id;
select season_id, count(*) from public.results group by season_id;
```

## Ambiente

Copie .env.example para .env:

- SUPABASE_URL: URL HTTPS do projeto.
- SUPABASE_PUBLISHABLE_KEY: chave publicável (anon legada também funciona); não usar service_role/secret key.
- FRONTEND_ORIGIN: origem exata, inicialmente http://localhost:5173.
- ACTIVE_SEASON: 2026. Seleção visual de temporada fica para próxima etapa.
- PORT: 3001.
- O frontend usa `/api` no domínio atual; o proxy do Vite encaminha para a API local. `VITE_API_URL` antigo não é mais usado.

Execute npm start e npm run dev. A API recusa inicializar sem configuração válida. /api/health verifica o processo Node, não a conexão remota.

## Contrato da API

Login: POST /api/usuarios/login com email/password do Supabase Auth. Retorna token; não há cadastro. Todas as rotas de dados exigem Authorization: Bearer com access token.

Leituras compatíveis: /api/jogos/list, /api/jogosById?id=..., /api/usuarios/list, /api/palpites/list, /api/palpitesById?jogoId=..., /api/palpitesByIdAndUser?jogoId=...&usuario=..., /api/resultados/list e /api/resultadosById?id=....

- POST /api/palpites/new: upsert de usuario/jogoId/golsCasa/golsFora antes do início.
- POST /api/palpites/batch: rows e correctionReason opcional; até 200 linhas, transação única.
- DELETE /api/palpitesDelete/:id: após início, corpo com correctionReason.
- POST /api/resultados/new: id/golsCasa/golsFora e correctionReason opcional; cadastro após início; correção de resultado exige justificativa.

Entrada tardia de palpite usa batch com justificativa. A grade já permite conferência e justificativa para correções, e o resultado tem um diálogo próprio de correção. PUTs antigos foram removidos; o frontend já usa os fluxos novos. Resultado não precisa mais atualizar o jogo em outra requisição.

## Publicação e limites

Supabase hospeda PostgreSQL, Auth e Data API. A Vercel pode hospedar o frontend e a API Node 24 juntos; veja [o guia de publicação](VERCEL.md). A entrada `api/index.ts` exporta o Express sem abrir porta. As rotas `/api` ficam separadas do fallback do React Router.

Aplique também `supabase/migrations/202610290002_login_rate_limit.sql` antes de iniciar a nova API. O limite de 10 tentativas por IP em 15 minutos fica no PostgreSQL e funciona entre instâncias. Não há reinicialização após login válido; a janela expira automaticamente. Só na Vercel a API confia no header de IP fornecido pela plataforma.

A sessão atual usa access token no navegador e exige novo login quando expira. Renovação automática/cookie e recuperação de conta continuam pendentes para a evolução como produto.

O plano Free pode pausar por baixa atividade durante sete dias; planos pagos não pausam por inatividade. Consulte [a política do Supabase](https://supabase.com/docs/guides/platform/free-project-pausing). Referências: [Data API](https://supabase.com/docs/guides/api), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [validação remota de usuário](https://supabase.com/docs/reference/javascript/auth-getuser).
