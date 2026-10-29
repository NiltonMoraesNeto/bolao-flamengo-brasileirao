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
| PRED-02 | Após início, justificar correção em 8–500 caracteres e auditar antes/depois/admin/data | API, banco e interface de justificativa implementados |
| PRED-03 | Lote até 200 linhas; erro reverte tudo e auditoria; duplicatas internas recusadas | Grade e conferência implementadas, com TanStack Form/Zod e mutação Query |
| RES-01 | Resultado único; placar e V/E/D derivados; correção justificada | Implementado e testado |
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
5. Confirmação envia lote. Depois do prazo, exige justificativa; imagem não prova automaticamente o horário original do palpite.
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
- Campos vazios significam ausência de palpite; 0×0 só existe quando ambos os zeros são preenchidos. Nunca preencher novos palpites automaticamente.
- Carregar valores salvos e enviar somente novos palpites ou placares alterados. Linha parcialmente preenchida, gols fracionários, negativos ou acima de 99 impedem a conferência.
- Conferência mostra participante, placar anterior e novo, com nomes dos times e contagem de inclusões/alterações. Nenhuma gravação antes do botão de confirmação.
- Após o início, justificativa obrigatória com 8–500 caracteres, conferida novamente ao salvar. Falha preserva os campos e permite nova tentativa.
- Confirmação de descarte ao trocar de jogo ou navegar pelos links do menu e aviso ao fechar/recarregar a página com alterações. Botões bloqueados durante gravação.
- Manter cadastro/correção de resultado e exclusão de palpite com confirmação; exclusões tardias também exigem justificativa.
- Validar parsing e alterações com testes determinísticos; testar lote no PostgreSQL descartável e conferir a interface real sem gravar palpites de teste no bolão.

## Mobile e tema escuro

- Navegação inferior até 1023 px, sem menu lateral sobre o formulário. A partir de 1024 px, navegação lateral e grade tabular.
- Palpites em cards por participante em telas menores; jogos em cards; classificação compacta. Sem rolagem horizontal da página nas larguras verificadas.
- Campos numéricos com teclado numeric, fonte de 16 px em telas menores e altura de 44 px. Diálogos cabem na viewport e têm rolagem própria, botões acessíveis e espaço para áreas seguras do celular.
- Um único provedor next-themes controla todos os componentes, incluindo notificações. Segue o sistema inicialmente e persiste a escolha manual. Tokens semânticos para fundo, texto, bordas, campos, tabelas e popovers nos dois temas.
- Trocar o tema não descarta o rascunho. Recarregar mantém a preferência e a rota autenticada.
- Os testes de navegador usaram leituras reais e rascunhos descartados. Não foram gravados palpites de teste no Supabase do bolão.
