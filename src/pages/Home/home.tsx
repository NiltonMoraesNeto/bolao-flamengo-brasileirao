import { useQuery } from "@tanstack/react-query";
import Card from "../../components/card";
import { TabelaJogos } from "../../components/tabela-jogos";
import { gamesQuery, predictionErrorMessage } from "../../services/prediction-grid";
import { Button } from "../../components/ui/button";

export default function Home() {
  const query = useQuery(gamesQuery);

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
      <header className="mb-6"><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Brasileirão 2026</p><h1 className="text-3xl font-bold tracking-tight">Jogos da temporada</h1><p className="mt-2 text-sm text-muted-foreground">Agenda e resultados do Flamengo.</p></header>
      <Card title="">
        {query.isPending ? <p role="status" className="py-6">Carregando jogos…</p>
          : query.isError ? <div role="alert" className="space-y-3 py-6"><p>{predictionErrorMessage(query.error, "load")}</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>
          : <TabelaJogos jogos={query.data} />}
      </Card>
    </div>
  );
}
