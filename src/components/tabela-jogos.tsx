import type { Jogo } from "../model/jogos";
import formatDateBR from "../utils/format-date-br";

function MatchStatus({ game }: { game: Jogo }) {
  const label = game.resultado === "V" ? "Vitória" : game.resultado === "D" ? "Derrota" : game.resultado === "E" ? "Empate"
    : Date.parse(game.data) <= Date.now() ? "Sem resultado" : "Agendado";
  const color = game.resultado === "V" ? "bg-green-500/10 text-green-700 dark:text-green-400"
    : game.resultado === "D" ? "bg-red-500/10 text-red-700 dark:text-red-400"
    : game.resultado === "E" ? "bg-amber-500/10 text-amber-800 dark:text-amber-300" : "bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${color}`}>{label}</span>;
}

export function TabelaJogos({ jogos }: { jogos: Jogo[] | undefined }) {
  if (!jogos?.length) return <p className="py-6 text-sm text-muted-foreground">Nenhum jogo cadastrado.</p>;
  return <>
    <div className="grid gap-3 sm:grid-cols-2 lg:hidden" aria-label="Jogos da temporada">
      {jogos.map(game => <article key={game.id} className="rounded-lg border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Rodada {game.rodada}</span><MatchStatus game={game} /></div>
        <div className="my-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm font-medium">
          <div className="min-w-0 break-words"><span className="mb-1 block text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Casa</span>{game.timeCasa}</div>
          <strong className="whitespace-nowrap rounded-md bg-muted px-2 py-2 text-base tabular-nums">{game.placar?.replace("x", " × ") || "×"}</strong>
          <div className="min-w-0 break-words text-right"><span className="mb-1 block text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Fora</span>{game.timeFora}</div>
        </div>
        <p className="border-t pt-2 text-xs text-muted-foreground">{formatDateBR(game.data)} · Brasília</p>
      </article>)}
    </div>
    <div className="hidden overflow-x-auto rounded-lg border lg:block">
      <table className="w-full bg-card text-sm"><caption className="sr-only">Jogos e resultados do Flamengo por rodada</caption>
        <thead className="bg-muted text-left text-muted-foreground"><tr>{["Rodada", "Data (Brasília)", "Casa", "Fora", "Placar", "Resultado"].map(label => <th key={label} scope="col" className="px-3 py-3 font-medium">{label}</th>)}</tr></thead>
        <tbody className="divide-y">{jogos.map(game => <tr key={game.id} className="hover:bg-muted/40">
          <td className="px-3 py-4 tabular-nums">{game.rodada}</td><td className="whitespace-nowrap px-3 py-4 text-muted-foreground">{formatDateBR(game.data)}</td>
          <td className="px-3 py-4">{game.timeCasa}</td><td className="px-3 py-4">{game.timeFora}</td>
          <td className="whitespace-nowrap px-3 py-4 font-medium tabular-nums">{game.placar?.replace("x", " × ") || "—"}</td><td className="px-3 py-4"><MatchStatus game={game} /></td>
        </tr>)}</tbody>
      </table>
    </div>
  </>;
}
