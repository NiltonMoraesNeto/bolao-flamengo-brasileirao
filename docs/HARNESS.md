# Harness de validação

`npm run check` executa ESLint, tipos da API, testes nativos do Node e build. CI usa Node 24 e npm ci. Três avisos preexistentes de Fast Refresh são informativos; erros reprovam a execução.

Para o deploy, `vercel build` gera o artefato oficial e `npm run check:vercel` inicializa a função compilada, confere health 200, recusa de leitura sem sessão e frontend gerado. Usa configuração fictícia sem acesso ao banco. Esse passo detectou e protege contra imports `.ts` mantidos no JavaScript de produção.

## Cobertura

- scoring.test.mjs: regulamento confirmado, empate não exato de 15 pontos, acerto parcial com desfecho errado na vitória do Flamengo sem pontuação, simetria de mando e ausência de mutação.
- legacy.test.mjs: exportação sem credenciais, escape de nomes, datas/IDs, órfãos, duplicatas e contrato de lote.
- database.test.mjs: migration executada em PostgreSQL embarcado (PGlite); grants/RLS, admin, negação de escrita direta, upsert, temporadas, prazo, rollback de lote e auditoria, correções de resultado e exclusões.
- prediction-batch.test.mjs: ausência de palpite versus 0×0, alterações reais, campos parciais, valores inválidos, descarte e justificativas.
- form-schemas.test.mjs: schemas Zod e integração real com FormApi/FieldApi do TanStack para bloquear submit inválido.
- query-client.test.mjs: reutilização/invalidação de leitura, chaves por jogo, limpeza de cache e ausência de retry em mutações/acesso recusado.
- api.test.mjs: HTTP com gateway Supabase simulado; autenticação, autorização, indisponibilidade, validação, rate limit e encaminhamento do lote.
- simulation.test.mjs: filtro de jogos futuros, fronteira do horário e resultado final, recusa de jogo bloqueado, alteração/inclusão/retirada de palpites locais, jogo sem palpites originais, desempates, restauração da origem, entradas congeladas sem mutação e TanStack Form/Zod com 0×0 explícito.
- deployment.test.mjs: configuração sem vazar valores, IP confiável somente na Vercel, falha fechada do limitador e migration de rate limit no PostgreSQL com contagem entre instâncias, isolamento por IP, expiração e negação de leitura/reset anônimos.

Auth users/uid são simulados para o SQL local. Gateway simulado testa Node sem rede externa. Isso não substitui validar Auth, PostgREST e permissões no projeto real.

## Compatibilidade

Na extração, o cálculo novo foi comparado com ambas as funções antigas em 2.592 combinações de placares/mando e com os 840 palpites com resultado dos JSONs. Não houve diferença. Essa foi uma verificação pontual, não uma dependência de código antigo nos testes permanentes.

Os JSONs reais não são fixtures dos testes. npm run db:prepare-import os valida sob demanda, sem escrever na nuvem.

A importação gerada também foi aplicada em um PostgreSQL local descartável: os 840 palpites entraram e os totais de pontos das 24 inscrições (12 por temporada) foram comparados com a origem, sem diferenças. Nenhum dado foi enviado ao Supabase nessa verificação.

## Antes do piloto

1. Criar projeto de teste, aplicar migration e autorizar o UUID do admin.
2. Importar uma vez e conferir contagens e classificação histórica.
3. Testar Data API real: anônimo e outra conta sem dados; admin só escreve pelas RPCs.
4. Testar navegador: login, expiração, inclusão/atualização, jogo sem palpites, resultado e celular.
5. Confirmar HTTPS, origem, segredos, backup e restauração.

Em 29/10/2026, o organizador criou o projeto Supabase, aplicou a migration e a importação e autorizou seu usuário. Com a aplicação local conectada ao Supabase real, foram verificados: recusa de leitura anônima, login do administrador, lista de 38 jogos de 2026, palpites/pontos do primeiro jogo e classificação dos 12 participantes. Os pontos e acertos exatos exibidos na classificação coincidiram com o cálculo do JSON original (liderança de 470 pontos e 6 acertos exatos).

Essa verificação não alterou registros remotos. Permanecem pendentes os testes de escrita no projeto real, leitura remota de 2025, acesso com outra conta, expiração de sessão, aparelho físico, backup/restauração e deploy.

## Ajuste da grade em 30/10/2026

Validação local com API fictícia em memória, sem acesso ao Supabase: dois participantes salvos renderizam placares em texto e um sem palpite mantém os dois inputs. Exclusão confirmada com justificativa devolve os campos vazios; reinserção via conferência/salvamento elimina novamente os inputs do participante. Pontuação e exclusão permanecem visíveis. Larguras 320, 390, 1024 e 1280 px sem overflow horizontal; colunas dos times com 144/176 px no desktop, mantendo cards no celular. Temas escuro e claro conferidos. `npm run check`: 38 testes, tipos e build aprovados; somente os três avisos preexistentes de Fast Refresh. Capturas fictícias em `.local/screenshots/grade-ajustada-desktop.jpg` e `.local/screenshots/grade-ajustada-mobile.jpg`.

## Simulação em 30/10/2026

Regra revisada pelo organizador: somente jogos futuros; palpites do cenário podem ser editados sem persistência. Suíte aprovada com 46 testes, tipos e build. PostgreSQL testou upgrade da base existente sem alterar o histórico, recusa de salvar/excluir palpites após início mesmo com justificativa, resultado final definitivo, bloqueio por resultado apesar de data futura, lote com rollback e manutenção da autorização/RLS.

No navegador com API fictícia e 12 participantes: seletor de simulação ofereceu apenas rodadas 34/35 futuras; rodadas 1/33 finalizadas ficaram indisponíveis. Na rodada 34, alterar ANA e adicionar CARLOS ao cenário 1×0 gerou ANA 70/2, BRUNO 55/0 e CARLOS 25/1. Restaurar recuperou ANA 2×0 e CARLOS vazio. Rodada 35 sem palpites originais aceitou um 0×0 temporário para CARLOS e exibiu 25 pontos, mantendo ANA 45/1 e BRUNO 40/0 oficiais. A página normal de jogo finalizado ficou sem inputs, exclusões ou correção de resultado. Instrumentação registrou zero tentativas de gravação pela simulação.

Telas de 320 e 390 px verificadas com Dialog rolável e sem overflow horizontal. Desktop e temas claro/escuro fazem parte da conferência visual. Capturas em `.local/screenshots/simulacao-mobile.jpg` e `.local/screenshots/simulacao-desktop.jpg`. Nenhum dado do Supabase foi acessado ou alterado nesta validação.

## Prints, futuramente

Conjunto autorizado/anonimizado com saídas revisadas: apelidos, nomes parecidos, mando invertido, cortes, texto irrelevante e gols ilegíveis. Medir precisão por campo e correções necessárias. Nunca salvar linhas incertas sem revisão e confirmação. Avaliação de visão separada dos testes determinísticos.

## Verificação da nova interface

Em 29/10/2026, a suíte passou com 35 testes. No navegador conectado ao Supabase real, foram verificados:

- Rodada futura sem valores padrão, placar incompleto bloqueado, 0×0 explícito e conferência de duas inclusões sem salvar.
- Voltar à edição mantém os campos; trocar de jogo ou navegar pelo menu pede confirmação de descarte.
- Rodada passada carrega os 12 palpites; conferência mostra placar anterior/novo e exige justificativa. Texto curto bloqueia confirmação; justificativa válida libera o botão. Correção de resultado também exige justificativa.
- Classificação segue com 470 pontos na liderança após a troca para Query.
- Larguras de 320, 390, 768 e 1280 px sem overflow horizontal da página; cards/barras de navegação para telas menores e tabela/menu lateral no desktop. Campos de 44 px e fonte de 16 px no celular.
- Temas claro e escuro, diálogo móvel sem overflow, preservação do rascunho ao alternar tema e persistência da escolha após recarregar.

Não houve confirmação de gravação/exclusão durante esses testes visuais. As mutações e o rollback foram testados em PostgreSQL descartável; rascunhos do navegador foram descartados. As capturas locais ficam em `.local/screenshots/`, ignoradas pelo Git.

## Publicação Vercel em 29/10/2026

Suíte com 38 testes passando, checagem de tipos e build. O artefato gerado por `vercel build` foi inicializado por `npm run check:vercel`; esse teste detectou imports `.ts` inválidos e confirmou a correção com `rewriteRelativeImportExtensions`.

Na URL pública de Production foram conferidos: HTML 200 em `/login`, `/home`, `/palpites` e `/classificacao`; bundle JS 200 sem endereço localhost ou chave publicável Supabase; `/api/health` 200 JSON; leituras e API desconhecida sem sessão retornando 401 JSON; caminho do JSON histórico retornando HTML do frontend, sem servir o arquivo. Um único login com credencial fictícia retornou 401 de credenciais inválidas, confirmando passagem pelo limitador remoto e Auth após a migration aplicada pelo organizador. Nenhum palpite ou resultado foi alterado.

O organizador entrou na aba publicada e confirmou o login. Foram conferidos os 38 jogos, inclusive a rodada 33 com Vasco × Flamengo em 29/10/2026 às 20h de Brasília, e a classificação dos 12 participantes com os mesmos pontos/acertos da validação local (Octávio: 470/6; Nilton: 440/5). Captura em `.local/screenshots/vercel-publicado.jpg`. Isso também confirma que a correção de horário já está aplicada no Supabase remoto.
