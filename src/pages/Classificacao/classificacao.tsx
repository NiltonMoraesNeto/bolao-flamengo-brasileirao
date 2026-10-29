import { useQuery } from "@tanstack/react-query";
import Card from "../../components/card";
import { TabelaClassificacao } from "../../components/tabela-classificacao";
import { Button } from "../../components/ui/button";
import type { Palpite } from "../../model/classificacao";
import { gamesQuery, participantsQuery, predictionsQuery, resultsQuery, predictionErrorMessage } from "../../services/prediction-grid";

export default function Classificacao() {
  const games = useQuery(gamesQuery);
  const participants = useQuery(participantsQuery);
  const predictions = useQuery(predictionsQuery);
  const results = useQuery(resultsQuery);
  const queries = [games, participants, predictions, results];
  const error = queries.find(query => query.isError)?.error;
  const pending = queries.some(query => query.isPending);
  const grouped: Record<string, Record<string, Palpite>> = {};
  for (const prediction of predictions.data ?? []) {
    (grouped[prediction.usuario] ??= {})[prediction.jogoId] = prediction;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      <header className="mb-6"><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Temporada 2026</p><h1 className="text-3xl font-bold tracking-tight">Classificação</h1><p className="mt-2 text-sm text-muted-foreground">Pontos e placares exatos dos participantes.</p></header>
      <Card title="">
        {error ? <div role="alert" className="space-y-3 py-6"><p>{predictionErrorMessage(error, "load")}</p><Button variant="outline" onClick={() => { for (const query of queries) void query.refetch(); }}>Tentar novamente</Button></div>
          : pending ? <p role="status" className="py-6">Carregando classificação…</p>
          : <TabelaClassificacao palpites={grouped} resultados={results.data ?? []}
            usuarios={participants.data?.map(user => user.nome) ?? []} jogos={games.data ?? []} />}
      </Card>
    </div>
  );
}
