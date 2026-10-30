import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Loader2, RotateCcw } from "lucide-react";
import { simulationFormSchema, simulationPredictionRowSchema, simulationScenarioSchema } from "../../domain/form-schemas";
import { createSimulationDraft, scenarioPredictions } from "../../domain/simulation-draft";
import { isFutureGame } from "../../domain/game-eligibility";
import { useCurrentTime } from "../../hooks/use-current-time";
import { calculateScore } from "../../domain/scoring";
import { simulateStandings } from "../../domain/standings";
import type { Standing } from "../../domain/standings";
import type { Score } from "../../domain/scoring";
import type { StoredPrediction } from "../../domain/prediction-batch";
import { gamesQuery, participantsQuery, predictionsQuery, resultsQuery, predictionErrorMessage } from "../../services/prediction-grid";
import type { GridGame, GridParticipant, GridResult } from "../../services/prediction-grid";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { FieldErrors } from "../../components/field-errors";
import { ClassificationTable } from "../../components/tabela-classificacao";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";

export default function Simulacao() {
  const games = useQuery(gamesQuery);
  const participants = useQuery(participantsQuery);
  const predictions = useQuery(predictionsQuery);
  const results = useQuery(resultsQuery);
  const queries = [games, participants, predictions, results];
  const error = queries.find(query => query.isError)?.error;
  const [selectedGame, setSelectedGame] = useState("");
  const now = useCurrentTime();
  const ready = games.data && participants.data && predictions.data && results.data;
  const futureGames = games.data?.filter(game => isFutureGame(game, results.data ?? [], now)) ?? [];
  const preferred = futureGames.find(game => predictions.data?.some(prediction => prediction.jogoId === game.id)) ?? futureGames[0];
  const game = futureGames.find(game => game.id === (selectedGame || preferred?.id)) ?? preferred;

  return <div className="mx-auto w-full max-w-5xl px-3 py-6 text-foreground sm:px-6 sm:py-8">
    <header className="mb-6"><h1 className="text-3xl font-bold tracking-tight">Simulação</h1>
      <p className="mt-2 text-sm text-muted-foreground">Escolha um jogo futuro, altere ou adicione palpites no cenário e teste um resultado. Nada será salvo nos palpites ou na classificação oficial.</p>
    </header>
    <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-6">
      {error ? <div role="alert" className="space-y-3"><p>{predictionErrorMessage(error, "load")}</p><Button variant="outline" onClick={() => { for (const query of queries) void query.refetch(); }}>Tentar novamente</Button></div>
        : !ready ? <p role="status" className="flex items-center gap-2 py-8"><Loader2 className="h-4 w-4 animate-spin" />Carregando dados para simulação…</p>
        : !games.data?.length ? <p className="py-8 text-muted-foreground">Nenhum jogo cadastrado nesta temporada.</p>
        : !futureGames.length ? <p role="status" className="py-8 text-muted-foreground">Nenhum jogo futuro disponível para simulação. Jogos iniciados ou com resultado oficial ficam bloqueados.</p>
        : !participants.data?.length ? <p className="py-8 text-muted-foreground">Nenhum participante cadastrado nesta temporada.</p>
        : <>
          <div className="mb-5 space-y-2 border-b pb-5">
            <Label htmlFor="simulation-game">Jogo</Label>
            <select id="simulation-game" value={game?.id ?? ""} onChange={event => setSelectedGame(event.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-base lg:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {futureGames.map(item => <option key={item.id} value={item.id}>Rodada {item.rodada} · {item.timeCasa} × {item.timeFora}</option>)}
            </select>
            {game && <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(game.data))} · horário de Brasília</p>}
          </div>
          {game && <SimulationEditor key={game.id} game={game} games={games.data} participants={participants.data}
            predictions={predictions.data ?? []} results={results.data ?? []} />}
        </>}
    </div>
  </div>;
}

function SimulationEditor({ game, games, participants, predictions, results }: {
  game: GridGame; games: GridGame[]; participants: GridParticipant[];
  predictions: StoredPrediction[]; results: GridResult[];
}) {
  const [simulation, setSimulation] = useState<{ score: Score; standings: Standing[]; count: number } | null>(null);
  const [error, setError] = useState("");
  const saved = new Map(predictions.filter(prediction => prediction.jogoId === game.id).map(prediction => [prediction.usuario, prediction]));
  const [defaults] = useState(() => ({ home: "", away: "", rows: createSimulationDraft(participants, predictions, game.id) }));
  const form = useForm({
    defaultValues: defaults,
    validators: { onChange: simulationScenarioSchema, onSubmit: simulationScenarioSchema },
    onSubmit: ({ value }) => {
      setError("");
      try {
        const score = { golsCasa: Number(value.home), golsFora: Number(value.away) };
        const scenario = scenarioPredictions(value.rows, game.id);
        if (!scenario.length) { setError("Preencha ao menos um palpite no cenário."); return; }
        setSimulation({ score, count: scenario.length,
          standings: simulateStandings(participants.map(p => p.nome), games, predictions, results, game.id, score, scenario) });
      } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível calcular a simulação."); }
    },
  });
  const values = useStore(form.store, state => state.values);
  const valid = simulationScenarioSchema.safeParse(values).success;
  const score = simulationFormSchema.safeParse(values).success ? { golsCasa: Number(values.home), golsFora: Number(values.away) } : null;
  const count = values.rows.filter(row => row.golsCasa.trim() && row.golsFora.trim() && simulationPredictionRowSchema.safeParse(row).success).length;

  return <section className="space-y-5" aria-label="Simulação de resultado">
    <form noValidate onSubmit={event => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }} className="space-y-5">
    <div className="space-y-4 rounded-lg border bg-muted/30 p-3 sm:p-4">
      <div><h2 className="font-semibold">Resultado simulado</h2>
        <p className="mt-1 text-xs text-muted-foreground">{saved.size} {saved.size === 1 ? "palpite salvo" : "palpites salvos"} · {count} de {participants.length} no cenário. Os pontos simulados serão somados aos resultados oficiais das outras rodadas.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {(["home", "away"] as const).map((name, index) => <form.Field key={name} name={name}>{field => <div className="min-w-0 space-y-2">
          <Label htmlFor={`simulation-${name}`} className="block min-h-10 text-sm sm:min-h-0">{index === 0 ? `${game.timeCasa} (casa)` : `${game.timeFora} (fora)`}</Label>
          <Input id={`simulation-${name}`} type="text" inputMode="numeric" autoComplete="off" maxLength={3}
            value={field.state.value} onChange={event => field.handleChange(event.target.value)} onBlur={field.handleBlur}
            aria-invalid={field.state.meta.errors.length > 0} aria-describedby={`simulation-${name}-error`} className="text-center tabular-nums" />
          <FieldErrors id={`simulation-${name}-error`} errors={field.state.meta.errors} />
        </div>}</form.Field>)}
      </div>
      {!count && <p role="status" className="text-sm text-muted-foreground">Preencha os palpites abaixo para criar o cenário, mesmo que ninguém tenha palpitado ainda.</p>}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={!valid || !count} className="w-full sm:w-auto"><FlaskConical className="h-4 w-4" />Simular classificação</Button>
        <Button type="button" variant="outline" onClick={() => { setError(""); form.reset({ home: values.home, away: values.away, rows: createSimulationDraft(participants, predictions, game.id) }); }}><RotateCcw className="h-4 w-4" />Restaurar palpites salvos</Button>
      </div>
    </div>
    <p className="text-xs text-muted-foreground">Edite os palpites apenas para este cenário. Dois campos vazios retiram o participante da simulação deste jogo; para 0 × 0, preencha os dois zeros. Trocar de jogo ou sair da página descarta o cenário.</p>

    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm lg:table-fixed"><caption className="sr-only">Palpites do cenário de {game.timeCasa} contra {game.timeFora}</caption>
        <thead className="hidden bg-muted/70 text-left text-muted-foreground lg:table-header-group"><tr>
          <th className="p-3 font-medium">Participante</th>
          <th className="w-36 p-3 text-center font-medium xl:w-44"><span className="mb-1 block text-xs">CASA</span><span className="block text-balance leading-snug">{game.timeCasa}</span></th>
          <th className="w-36 p-3 text-center font-medium xl:w-44"><span className="mb-1 block text-xs">FORA</span><span className="block text-balance leading-snug">{game.timeFora}</span></th>
          <th className="w-24 p-3 text-center font-medium">Pontos simulados</th>
        </tr></thead>
        <tbody className="block space-y-3 bg-background p-2 lg:table-row-group lg:space-y-0 lg:divide-y lg:bg-transparent lg:p-0">
          {values.rows.map((row, rowIndex) => {
            const original = saved.get(row.usuario);
            const present = Boolean(row.golsCasa.trim() && row.golsFora.trim());
            const changed = original ? Number(row.golsCasa) !== original.golsCasa || Number(row.golsFora) !== original.golsFora || !present : present;
            const rowValid = simulationPredictionRowSchema.safeParse(row).success;
            const prediction = present && rowValid
              ? { golsCasa: Number(row.golsCasa), golsFora: Number(row.golsFora) } : null;
            const state = !rowValid ? "Revisar palpite" : !present ? original ? "Retirado do cenário" : "Sem palpite no cenário"
              : changed ? original ? "Alterado no cenário" : "Adicionado ao cenário" : "Palpite original";
            return <tr key={row.participantId} className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 lg:table-row lg:rounded-none lg:border-0 lg:p-0">
              <th scope="row" className="col-span-2 break-words text-left font-medium lg:p-3">{row.usuario}<span className="mt-1 block text-xs font-normal text-muted-foreground">{state}</span></th>
              {(["golsCasa", "golsFora"] as const).map((field, index) => <td key={field} className="text-center lg:p-3">
                <label htmlFor={`scenario-${row.participantId}-${field}`} className="mb-1 block min-h-8 text-xs text-muted-foreground lg:sr-only lg:min-h-0">{index === 0 ? `${game.timeCasa} (casa)` : `${game.timeFora} (fora)`}</label>
                <form.Field name={`rows[${rowIndex}].${field}`}>{control => <>
                  <Input id={`scenario-${row.participantId}-${field}`} type="text" inputMode="numeric" autoComplete="off" maxLength={3}
                    aria-label={`${row.usuario}: gols do ${index === 0 ? game.timeCasa : game.timeFora} no cenário`}
                    aria-invalid={control.state.meta.errors.length > 0} aria-describedby={`scenario-${row.participantId}-${field}-error`}
                    value={control.state.value} onChange={event => control.handleChange(event.target.value)} onBlur={control.handleBlur}
                    className="mx-auto w-full text-center tabular-nums lg:w-16" />
                  <FieldErrors id={`scenario-${row.participantId}-${field}-error`} errors={control.state.meta.errors} />
                </>}</form.Field>
              </td>)}
              <td className="col-span-2 flex items-center justify-between border-t pt-2 tabular-nums lg:table-cell lg:border-0 lg:p-3 lg:text-center"><span className="text-xs text-muted-foreground lg:hidden">Pontos simulados</span><span>{prediction && score ? calculateScore(score, prediction, game.timeCasa).pontos : "—"}</span></td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    </form>

    <Dialog open={simulation !== null} onOpenChange={open => { if (!open) setSimulation(null); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Classificação simulada</DialogTitle><DialogDescription>Rodada {game.rodada} · {game.timeCasa} {simulation?.score.golsCasa} × {simulation?.score.golsFora} {game.timeFora}. {simulation?.count} {simulation?.count === 1 ? "palpite" : "palpites"} no cenário. A classificação e os palpites oficiais permanecem inalterados.</DialogDescription></DialogHeader>
        {simulation && <ClassificationTable standings={simulation.standings} caption="Classificação simulada por pontos e placares exatos" />}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setSimulation(null)}>Fechar simulação</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
