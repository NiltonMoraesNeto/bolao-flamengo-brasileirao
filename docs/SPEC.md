# Especificação de evolução

Atualização: 29/10/2026. Supabase configurado pelo organizador; frontend e API publicados na Vercel. Organizador confirmou login válido na publicação; os 38 jogos e a classificação dos 12 participantes foram conferidos online. Páginas, health, proteção da API e login com credencial fictícia também foram verificados. Teste remoto de escrita pendente.

## Objetivo e arquitetura

Reduzir o trabalho do organizador, preservando histórico. Somente ele faz login. Participantes são entidades do bolão, não contas de autenticação. Cadastro público, pagamentos e participação autônoma ficam fora desta versão.

React/TypeScript + Tailwind/shadcn + TanStack Form/Zod + TanStack Query → Node/Express/TypeScript → Supabase Data API/PostgreSQL, com JWT do Supabase Auth. Node usa chave publicável e token do usuário, sem service_role. O banco protege escritas mesmo quando uma RPC é chamada diretamente.

Padrão solicitado pelo organizador: formulários com TanStack Form e schemas Zod; consultas e mutações da API com TanStack Query. Axios é apenas o transporte. Não buscar dados em useEffect nem converter falhas de rede em listas vazias. As chaves de cache são centralizadas, e o cache é limpo ao sair/expirar a sessão.

## Requisitos e aceitação

| ID | Requisito e aceitação | Estado |
| --- | --- | --- |
| AUTH-01 | Um único admin; anônimo não acessa dados e outra conta recebe 403 | API e RLS testados localmente |
| AUTH-02 | Token inválido/expirado recebe 401 e sessão é encerrada na interface | Implementado; renovação automática pendente |
| DATA-01 | IDs iguais em temporadas diferentes não cruzam dados | Implementado e testado |
| DATA-02 | Importar 840 palpites, 76 jogos, 70 resultados e 24 inscrições sem credenciais | Importação confirmada pelo organizador; jogos e classificação de 2026 conferidos no navegador |
| PRED-01 | Unique por temporada/jogo/participante; gols inteiros de 0 a 99 | Implementado e testado |
| PRED-02 | Palpites oficiais só podem ser incluídos/alterados/excluídos antes do início e sem resultado final | Interface bloqueada; migration de bloqueio preparada e testada |
| PRED-03 | Lote até 200 linhas; erro reverte tudo e auditoria; duplicatas internas recusadas | Grade e conferência implementadas, com TanStack Form/Zod e mutação Query |
| RES-01 | Primeiro resultado após início; resultado final único e definitivo | Interface implementada; migration testada impede correção mesmo com justificativa |
| SIM-01 | Simular somente jogos futuros, com palpites editáveis locais e classificação em Dialog | Implementado em 30/10/2026; nenhuma gravação ou mutação do cache oficial |
| SCORE-01 | Cálculo único e versionado segue o regulamento confirmado pelo organizador | Implementado e confirmado em 29/10/2026 |
| IMG-01 | Print só gera gravação após conferência e confirmação | Especificado; não implementado |
| UX-01 | Mobile, teclado, labels e estados de carregamento/vazio/erro | Layout e temas verificados no navegador em 320, 390, 768 e 1280 px; aparelho físico pendente |
| OPS-01 | CI, configuração, teste remoto, backup e restauração | CI, deploy e leitura autenticada online prontos; escrita, backup e restauração pendentes |
| OPS-02 | Login limitado entre instâncias, sem contagem em memória | Migration confirmada pelo organizador; PostgreSQL e integração online verificados |

## Regulamento confirmado: legacy-v1

Aplicar em ordem:

1. Placar exato: 25 e um acerto exato.
2. Desfecho correto (casa/empate/fora) e gols de um time corretos: 20.
3. Desfecho correto sem gols corretos, incluindo empate não exato: 15.
4. Desfecho errado, Flamengo empatou/perdeu e gols de um time corretos: 5.
5. Demais situações: 0. Sem resultado, não calcular pontos definitivos.

O organizador confirmou em 29/10/2026 que essas regras correspondem ao combinado entre os amigos. Em particular, empate não exato vale 15; acertar gols de um time com desfecho errado não pontua quando o Flamengo vence. As categorias não acumulam pontos. A versão `legacy-v1` permanece porque o cálculo não mudou. Nova versão exige migration e cálculo correspondente; não editar o histórico silenciosamente.

A definição de posições em caso de empate completo na classificação continua pendente; essa decisão é separada das regras de pontuação confirmadas.

## Print → palpites

1. Admin escolhe temporada e jogo e envia imagem.
2. Serviço extrai candidatos estruturados. Texto da imagem é dado, nunca instrução para ferramentas ou banco.
3. Associar apelidos e sinalizar nomes desconhecidos, mando incerto, ilegibilidade, duplicatas e conflitos com palpites existentes.
4. Mostrar grade junto da referência. Valor ilegível fica pendente; nunca assumir 0×0. Admin corrige e confirma jogo/mando/placares.
5. Confirmação envia lote somente para jogo futuro. Após o início, o lançamento fica bloqueado, inclusive por imagem.
6. Transação grava e audita. Unique evita duplicar palpites; uma futura chave de importação deve evitar auditoria repetida do mesmo upload.

Serviço de visão, limites de imagem, armazenamento privado e retenção serão definidos em IMG-01. Ainda não existe upload ou leitura automática de prints.

## Etapas

1. Stack estável, pontuação preservada e harness: concluída localmente.
2. Node API, schema Supabase, autorização e conversor: implementados; Supabase configurado e leitura de 2026 validada com login real localmente. Frontend/API publicados na Vercel. Gravação remota pendente.
3. Grade, correções, TanStack Form/Zod, Query, mobile e temas claro/escuro implementados e conferidos no navegador. Renovação de sessão e teste de escrita remota seguem pendentes.
4. Extração de prints e avaliação com exemplos revisados.
5. Refinamentos de produto e piloto do bolão atual. Publicação realizada na Vercel, com os mesmos dados no Supabase. A navegação, os temas e as páginas principais já foram revisados.
6. Produto com vários organizadores, isolamento por bolão e regras por temporada.

Fluxo spec-driven: requisito → critérios/casos → implementação → harness → registro de limites. Dados reais não devem virar fixtures públicas.

## Grade de palpites — entrega de 29/10/2026

- Uma linha por participante e seleção de jogo com rodada, mando e horário.
- Ajuste de 30/10/2026: palpites oficiais salvos mostram o placar como texto, no desktop e no celular. Em jogos futuros, inputs aparecem para participantes sem palpite; excluir restaura os campos e salvar novamente volta ao texto. Após o início ou resultado final, todos os palpites ficam apenas para consulta.
- Colunas dos times com 144 px no desktop e 176 px a partir de 1280 px, com quebra de linha legível para nomes longos.
- Campos vazios significam ausência de palpite; 0×0 só existe quando ambos os zeros são preenchidos. Nunca preencher novos palpites automaticamente.
- Carregar valores salvos e enviar somente novos palpites ou placares alterados. Linha parcialmente preenchida, gols fracionários, negativos ou acima de 99 impedem a conferência.
- Conferência mostra participante, placar anterior e novo, com nomes dos times e contagem de inclusões/alterações. Nenhuma gravação antes do botão de confirmação.
- Após o início ou resultado final, inclusão, alteração e exclusão de palpite oficial ficam bloqueadas. O prazo é revisto na confirmação e no banco; justificativas não destravam o jogo.
- Confirmação de descarte ao trocar de jogo ou navegar pelos links do menu e aviso ao fechar/recarregar a página com alterações. Botões bloqueados durante gravação.
- Manter primeiro cadastro de resultado após início com confirmação; após salvar, o resultado é definitivo. Jogos finalizados não exibem ações de alteração ou exclusão.
- Validar parsing e alterações com testes determinísticos; testar lote no PostgreSQL descartável e conferir a interface real sem gravar palpites de teste no bolão.

## Mobile e tema escuro

- Navegação inferior até 1023 px, sem menu lateral sobre o formulário. A partir de 1024 px, navegação lateral e grade tabular.
- Palpites em cards por participante em telas menores; jogos em cards; classificação compacta. Sem rolagem horizontal da página nas larguras verificadas.
- Campos numéricos com teclado numeric, fonte de 16 px em telas menores e altura de 44 px. Diálogos cabem na viewport e têm rolagem própria, botões acessíveis e espaço para áreas seguras do celular.
- Um único provedor next-themes controla todos os componentes, incluindo notificações. Segue o sistema inicialmente e persiste a escolha manual. Tokens semânticos para fundo, texto, bordas, campos, tabelas e popovers nos dois temas.
- Trocar o tema não descarta o rascunho. Recarregar mantém a preferência e a rota autenticada.
- Os testes de navegador usaram leituras reais e rascunhos descartados. Não foram gravados palpites de teste no Supabase do bolão.

## Simulação — entrega de 30/10/2026

- Página protegida `/simulacao`, com item Simulação no menu lateral e na navegação móvel de quatro itens.
- TanStack Query lê jogos, participantes, palpites e resultados pelas consultas já existentes. A seleção contém somente jogos com data futura e sem resultado oficial. Relógio revisto a cada segundo e no cálculo; ao chegar o início, o jogo deixa de ser elegível.
- TanStack Form/Zod controla resultado e uma cópia editável dos palpites. Permite alterar um palpite carregado, adicionar para quem ainda não palpitou e esvaziar ambos os gols para retirar alguém apenas do cenário. Dois gols inteiros de 0 a 99, incluindo 0×0 explícito; linha parcial bloqueia cálculo. Exige ao menos um palpite no cenário, mesmo que o jogo não tenha palpites originais.
- Restaurar palpites salvos reconstrói o rascunho usando apenas as leituras originais; trocar de jogo ou sair descarta as alterações temporárias.
- Botão Simular classificação abre Dialog shadcn com a classificação total, somando os resultados oficiais das outras rodadas ao placar e aos palpites hipotéticos do jogo futuro. Palpites temporários substituem os originais apenas na cópia do cenário.
- `standings.ts` centraliza o cálculo usado pela classificação oficial e simulada, preservando pontos, acertos exatos e ordem atual em empate completo. Ausência de palpite não gera pontos.
- A pontuação de cada palpite no cenário também aparece na grade. O Dialog informa o jogo e o placar hipotético.
- Simulação vive apenas em estado local da página: não faz POST/PUT/DELETE, não modifica o cache oficial e não grava resultado ou palpites. Fechar o Dialog permite testar outro placar.
- A regra de bloqueio oficial requer aplicar `supabase/migrations/202610300003_lock_finished_games.sql` no projeto existente. A migration atualiza RPCs sem alterar registros históricos e foi testada em PostgreSQL descartável. Primeiro registro de resultado encerra o jogo; correções posteriores são recusadas.
- Validação visual e de rede feita com dados fictícios locais, sem acesso ao Supabase; publicação depende de commit/push e PR para `main`.
