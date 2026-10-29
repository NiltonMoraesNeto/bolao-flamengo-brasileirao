import { useEffect, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Check, ClipboardCheck, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPredictionDraft, isValidCorrectionReason, preparePredictionBatch } from "../domain/prediction-batch";
import type { PredictionChange, StoredPrediction } from "../domain/prediction-batch";
import { predictionDraftFormSchema, SubmissionError } from "../domain/form-schemas";
import { calculateScore } from "../domain/scoring";
import { predictionGameQuery, predictionErrorMessage } from "../services/prediction-grid";
import type { GridGame, GridParticipant, PredictionGameData } from "../services/prediction-grid";
import { useRemovePrediction, useSavePredictionBatch } from "../hooks/use-prediction-mutations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { GameResultDialog } from "./game-result-dialog";
import { PredictionConfirmDialog } from "./prediction-confirm-dialog";

interface PredictionGridProps {
  game: GridGame; participants: GridParticipant[];
  onDirtyChange: (dirty: boolean) => void; onBusyChange: (busy: boolean) => void;
}

export function PredictionGrid(props: PredictionGridProps) {
  const query = useQuery(predictionGameQuery(props.game.id));
  if (query.isPending) return <div role="status" className="flex items-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando os palpites…</div>;
  if (!query.data) return <div role="alert" className="space-y-3 rounded-lg border border-red-200 p-5"><p>{predictionErrorMessage(query.error, "load")}</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>;
  return <PredictionEditor {...props} data={query.data} />;
}

function PredictionEditor({ game, participants, data, onDirtyChange, onBusyChange }: PredictionGridProps & { data: PredictionGameData }) {
  const { predictions, result } = data;
  // O rascunho só muda por edição, descarte ou confirmação. Refetch não apaga campos.
  const [defaults, setDefaults] = useState(() => ({ rows: createPredictionDraft(participants, predictions) }));
  const [now, setNow] = useState(Date.now);
  const [review, setReview] = useState<PredictionChange[] | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoredPrediction | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const saveMutation = useSavePredictionBatch(game.id, participants);
  const deleteMutation = useRemovePrediction(game.id);
  const saving = saveMutation.isPending || deleteMutation.isPending;
  const form = useForm({
    defaultValues: defaults,
    validators: { onChange: predictionDraftFormSchema, onSubmit: predictionDraftFormSchema },
    onSubmit: ({ value }) => {
      const batch = preparePredictionBatch(value.rows, game.id);
      if (batch.changes.length && !Object.keys(batch.errors).length) {
        setReview(batch.changes);
        setNow(Date.now());
      }
    },
  });
  const draft = useStore(form.store, state => state.values.rows);
  const batch = preparePredictionBatch(draft, game.id);
  const invalid = Object.keys(batch.errors).length > 0;
  const dirty = invalid || batch.changes.length > 0;
  const started = Date.parse(game.data) <= now;

  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { onBusyChange(saving); }, [saving, onBusyChange]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const assertReason = (reason: string) => {
    const afterKickoff = Date.parse(game.data) <= Date.now();
    setNow(Date.now());
    if (afterKickoff && !isValidCorrectionReason(reason)) {
      throw new SubmissionError("O jogo já começou. Informe uma justificativa com pelo menos 8 caracteres.");
    }
    return afterKickoff ? reason : undefined;
  };

  const resetDraft = (rows: StoredPrediction[]) => {
    const next = { rows: createPredictionDraft(participants, rows) };
    setDefaults(next);
    form.reset(next);
  };

  const save = async (reason: string) => {
    if (!review || saving) return;
    const saved = await saveMutation.mutateAsync({ changes: review, reason: assertReason(reason) });
    const changedNames = new Set(saved.map(row => row.usuario));
    resetDraft([...predictions.filter(row => !changedNames.has(row.usuario)), ...saved]);
    setReview(null);
    toast.success(`${saved.length} ${saved.length === 1 ? "palpite salvo" : "palpites salvos"}`);
  };

  const remove = async (reason: string) => {
    if (!deleteTarget || saving) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id, reason: assertReason(reason) });
    resetDraft(predictions.filter(row => row.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Palpite excluído");
  };

  return (
    <section className="space-y-5" aria-label="Grade de palpites">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-sm font-medium">{result ? `Resultado final: ${result.golsCasa} × ${result.golsFora}` : started ? "Jogo iniciado · lançamento com justificativa" : "Aberto para palpites"}</p>
          <p className="text-xs text-muted-foreground">{predictions.length} de {participants.length} palpites salvos.</p>
        </div>
        {started && <Button variant="outline" disabled={dirty || saving}
          title={dirty ? "Salve ou descarte os palpites antes de alterar o resultado" : undefined}
          onClick={() => setResultOpen(true)}>{result ? "Corrigir resultado" : "Registrar resultado"}</Button>}
      </div>

      <p id="grid-help" className="text-sm text-muted-foreground">
        Deixe os dois campos vazios para quem não enviou palpite. Para 0 × 0, preencha os dois zeros.
      </p>
      <form noValidate onSubmit={event => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }}>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm" aria-describedby="grid-help">
          <caption className="sr-only">Palpites de {game.timeCasa} contra {game.timeFora}, rodada {game.rodada}</caption>
          <thead className="hidden bg-muted/70 text-left text-muted-foreground lg:table-header-group">
            <tr><th className="p-3 font-medium">Participante</th>
              <th className="w-20 p-2 text-center font-medium"><span className="block text-xs">CASA</span>{game.timeCasa}</th>
              <th className="w-20 p-2 text-center font-medium"><span className="block text-xs">FORA</span>{game.timeFora}</th>
              <th className="hidden p-3 font-medium lg:table-cell">Situação</th>
              {result && <th className="p-2 text-center font-medium">Pts</th>}
              <th className="w-10 p-2"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="block space-y-3 bg-background p-2 lg:table-row-group lg:space-y-0 lg:divide-y lg:bg-transparent lg:p-0">
            {draft.map((row, rowIndex) => {
              const error = batch.errors[row.participantId];
              const changed = batch.changes.some(change => change.usuario === row.usuario);
              const state = error ? "Revisar" : changed ? row.original ? "Alterado" : "Novo" : row.original ? "Salvo" : "Sem palpite";
              const points = row.original && result ? calculateScore(result, row.original, game.timeCasa).pontos : null;
              return (
                <tr key={row.participantId} className={`relative grid grid-cols-2 gap-x-3 gap-y-3 rounded-lg border p-3 lg:table-row lg:rounded-none lg:border-0 lg:p-0 ${changed ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-card hover:bg-muted/30"}`}>
                  <th scope="row" className="col-span-2 block pr-12 text-left font-medium lg:table-cell lg:p-3">
                    {row.usuario}
                    <span className="mt-1 block text-xs font-normal text-muted-foreground lg:hidden">{state}</span>
                    {error && <span id={`error-${row.participantId}`} role="alert" className="mt-1 block text-xs font-normal text-red-600 dark:text-red-400">{error}</span>}
                  </th>
                  {(["golsCasa", "golsFora"] as const).map((field, index) => (
                    <td key={field} className="block lg:table-cell lg:p-2">
                      <label htmlFor={`prediction-${row.participantId}-${field}`} className="mb-1 block text-xs text-muted-foreground lg:sr-only">{index === 0 ? `${game.timeCasa} (casa)` : `${game.timeFora} (fora)`}</label>
                      <form.Field name={`rows[${rowIndex}].${field}`}>{control => <Input id={`prediction-${row.participantId}-${field}`} type="text" inputMode="numeric" autoComplete="off" pattern="[0-9]{1,2}" maxLength={3}
                        aria-label={`${row.usuario}: gols do ${index === 0 ? game.timeCasa : game.timeFora}`}
                        aria-invalid={Boolean(error)} aria-describedby={error ? `error-${row.participantId}` : undefined}
                        value={control.state.value} onChange={event => control.handleChange(event.target.value)} onBlur={control.handleBlur}
                        disabled={saving} className="mx-auto w-full bg-background text-center tabular-nums lg:w-16" />}</form.Field>
                    </td>
                  ))}
                  <td className="hidden p-3 lg:table-cell"><span className={changed ? "font-medium text-amber-800 dark:text-amber-300" : "text-muted-foreground"}>{state}</span></td>
                  {result && <td className="col-span-2 flex items-center justify-between border-t pt-2 text-center tabular-nums lg:table-cell lg:border-0 lg:p-2" title={changed ? "Pontuação do palpite salvo; será atualizada após confirmar" : undefined}><span className="text-xs text-muted-foreground lg:hidden">Pontos do palpite salvo</span><span>{points ?? "—"}</span>{changed && points !== null && <span className="sr-only">, referente ao palpite salvo</span>}</td>}
                  <td className="absolute right-2 top-2 lg:static lg:table-cell lg:p-2">{row.original && <Button type="button" size="icon" variant="ghost" className="h-11 w-11 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                    aria-label={`Excluir palpite de ${row.usuario}`} disabled={dirty || saving}
                    title={dirty ? "Salve ou descarte as alterações antes de excluir" : "Excluir palpite"}
                    onClick={() => { setDeleteTarget(row.original ?? null); setNow(Date.now()); }}><Trash2 className="h-4 w-4" /></Button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {result && dirty && <p className="text-xs text-muted-foreground">Os pontos exibidos correspondem aos palpites já salvos. Serão recalculados após a confirmação.</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p role="status" className="text-sm text-muted-foreground">
          {invalid ? "Revise os campos indicados antes de continuar." : batch.changes.length ? `${batch.changes.length} ${batch.changes.length === 1 ? "palpite para conferir" : "palpites para conferir"}` : <span className="flex items-center gap-2"><Check className="h-4 w-4" />Nenhuma alteração pendente.</span>}
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button type="button" variant="outline" disabled={!dirty || saving} onClick={() => setDiscardOpen(true)}><RotateCcw className="h-4 w-4" />Descartar</Button>
          <Button type="submit" variant="destructive" disabled={invalid || !batch.changes.length || saving}>
            <ClipboardCheck className="h-4 w-4" />Conferir palpites
          </Button>
        </div>
      </div>

      </form>
      {review && <PredictionConfirmDialog title="Conferir palpites"
        description={`Rodada ${game.rodada} · ${game.timeCasa} (casa) × ${game.timeFora} (fora). Apenas os palpites abaixo serão salvos.`}
        requiresReason={started} confirmLabel={`Confirmar e salvar ${review.length}`} cancelLabel="Voltar à edição" onConfirm={save} onClose={() => setReview(null)}>
        <div className="rounded-md bg-muted p-3 text-sm">{review.filter(row => !row.original).length} {review.filter(row => !row.original).length === 1 ? "novo" : "novos"} · {review.filter(row => row.original).length} {review.filter(row => row.original).length === 1 ? "alterado" : "alterados"}</div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">Conferência de alterações</caption>
          <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2 font-medium">Participante</th><th className="p-2 font-medium">Anterior</th><th className="p-2 font-medium">Novo</th></tr></thead>
          <tbody>{review.map(row => <tr key={row.usuario} className="border-b"><th scope="row" className="py-3 text-left font-medium">{row.usuario}</th><td className="p-2 tabular-nums">{row.original ? `${row.original.golsCasa} × ${row.original.golsFora}` : "Sem palpite"}</td><td className="p-2 font-semibold tabular-nums">{row.golsCasa} × {row.golsFora}</td></tr>)}</tbody>
        </table></div>
      </PredictionConfirmDialog>}

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}><DialogContent>
        <DialogHeader><DialogTitle>Descartar alterações?</DialogTitle><DialogDescription>Os campos voltarão aos valores salvos deste jogo. Os palpites já registrados serão mantidos.</DialogDescription></DialogHeader>
        <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setDiscardOpen(false)}>Continuar editando</Button><Button variant="destructive" onClick={() => { resetDraft(predictions); setDiscardOpen(false); }}>Descartar alterações</Button></DialogFooter>
      </DialogContent></Dialog>

      {deleteTarget && <PredictionConfirmDialog title="Excluir palpite?"
        description={`${deleteTarget.usuario}: ${deleteTarget.golsCasa} × ${deleteTarget.golsFora} em ${game.timeCasa} × ${game.timeFora}. A exclusão será registrada no histórico.`}
        requiresReason={started} confirmLabel="Confirmar exclusão" onConfirm={remove} onClose={() => setDeleteTarget(null)} />}

      {resultOpen && <GameResultDialog game={game} result={result} onBusyChange={onBusyChange} onClose={() => setResultOpen(false)} />}

    </section>
  );
}
