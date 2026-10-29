# Revisão técnica — 29/10/2026

O frontend já tinha React 19, TypeScript estrito, Tailwind 3 e shadcn/Radix. O `npm start` executava Express próprio em CommonJS, lendo e escrevendo JSON diretamente. Não era uma biblioteca de mock.

## Auditoria dos dados

| Origem | Ano das datas | Participantes | Jogos | Palpites | Resultados |
| --- | --- | ---: | ---: | ---: | ---: |
| db.json | 2026 | 12 | 38 | 384 | 32 |
| db copy.json | 2025 | 12 | 38 | 456 | 38 |

Não foram encontradas duplicatas de participante/jogo ou resultado, referências órfãs ou gols negativos/fracionários nos arquivos atuais. Isso não certifica datas, origem dos palpites ou regulamento. O arquivo “copy” é tratado como histórico de 2025, não como cópia descartável.

## Problemas encontrados e tratamento

| Prioridade | Evidência inicial | Impacto | Tratamento nesta etapa |
| --- | --- | --- | --- |
| Crítica | API não validava JWT nas rotas | Escrita sem login | Substituída por Node/TS com validação Auth, autorização de admin e RLS |
| Alta | Senha em texto simples versionada; login retornava objeto completo | Exposição de credenciais | Novo login Supabase e importação sem credenciais; originais ainda preservados |
| Alta | Resultado salvo por POST + PUT separados | Divergência e duplicatas | Transação única e placar/V/E/D derivados por view |
| Alta | Verificação de duplicidade apenas no navegador | Duplicatas por concorrência | Unique constraint e upsert no banco |
| Alta | Sem validação e prazo no servidor | Dados arbitrários e alteração tardia | Zod, constraints, RPCs e correção com justificativa/auditoria |
| Alta | Pontuação duplicada em componentes | Regra podia divergir | Função única versionada e testes |
| Alta | Build quebrado | Publicação sem base reproduzível | Alias TS corrigido e variáveis redundantes removidas |
| Média | Uma busca de resultado por palpite e mando atualizado em paralelo | Rede redundante e risco de cálculo com mando antigo | Uma busca por recurso e descarte de resposta obsoleta |
| Média | IDs declarados como números, mas armazenados como strings | Tipos incorretos | IDs normalizados para strings |
| Média | Participantes fixos na classificação | Divergência de cadastro | Lista carregada da API |
| Média | Dependências com avisos e URLs fixas | Risco operacional | Atualizações de segurança e ambiente configurável |

O histórico Git ainda pode conter credenciais antigas. Antes de abrir o repositório, retire dados pessoais da versão compartilhada e substitua credenciais reutilizadas. Não houve exclusão ou reescrita desse histórico.

## Regulamento confirmado e desempate pendente

O organizador confirmou em 29/10/2026 as regras de pontuação documentadas na spec. Empate não exato, como prever 0×0 e terminar 1×1, vale **15**. Acertar gols de um time com desfecho errado vale **0** quando o Flamengo vence. O ramo antigo de 5 para empate não exato era inalcançável e não representava o combinado. O cálculo e os totais históricos permanecem iguais.

Desempate existente: pontos e acertos exatos. Empate completo ainda recebe posições sequenciais, na ordem dos participantes; definir posições compartilhadas ou outro critério é uma decisão de negócio pendente.

## Melhorias de produto

1. Grade por jogo com conferência e correções auditadas: implementada com TanStack Form/Zod e Query. Gravação no projeto real ainda precisa de validação com um palpite autorizado.
2. Pontos explicáveis por palpite, exportação/compartilhamento da classificação e seleção de temporada.
3. Tokens rubro-negros, temas claro/escuro, navegação responsiva e estados de carregamento/erro implementados. Revisão em aparelho físico e avaliação completa de acessibilidade continuam recomendadas.
4. Print → extração → conferência → confirmação → gravação transacional.
5. Produto futuro: isolamento por organizador/bolão antes de admitir outros administradores.

Em 29/10/2026 foi realizada conferência autenticada das páginas de jogos, palpites e classificação de 2026 com o Supabase real. Os totais dos 12 participantes coincidiram com a origem. Posteriormente, navegação, tabelas, formulários e temas foram revisados, com conferência em larguras de celular, tablet e desktop. Testes de escrita remota seguem pendentes.
