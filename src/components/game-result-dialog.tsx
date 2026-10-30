import { useEffect, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { resultFormSchema } from "../domain/form-schemas";
import { predictionErrorMessage } from "../services/prediction-grid";
import type { GridGame, GridResult } from "../services/prediction-grid";
import { useSaveGameResult } from "../hooks/use-prediction-mutations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { FieldErrors } from "./field-errors";
import { toast } from "sonner";

export function GameResultDialog({ game, result, onBusyChange, onClose }: {
  game: GridGame; result: GridResult | null;
  onBusyChange: (busy: boolean) => void; onClose: () => void;
}) {
  const [error, setError] = useState("");
  const mutation = useSaveGameResult(game.id);
  const schema = resultFormSchema(false);
  const [defaults] = useState(() => ({ home: result ? String(result.golsCasa) : "", away: result ? String(result.golsFora) : "", reason: "" }));
  const form = useForm({
    defaultValues: defaults, validators: { onChange: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError("");
      if (result) { setError("Este jogo já tem resultado final e não pode ser alterado."); return; }
      try {
        await mutation.mutateAsync({ value: { id: game.id, golsCasa: Number(value.home), golsFora: Number(value.away) }, reason: result ? value.reason.trim() : undefined });
        toast.success("Resultado registrado");
        onClose();
      } catch (error) { setError(predictionErrorMessage(error)); }
    },
  });
  const busy = useStore(form.store, state => state.isSubmitting);
  const values = useStore(form.store, state => state.values);
  useEffect(() => { onBusyChange(busy); }, [busy, onBusyChange]);
  useEffect(() => () => onBusyChange(false), [onBusyChange]);

  return (
    <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
      <DialogContent onInteractOutside={event => { if (busy) event.preventDefault(); }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Registrar resultado</DialogTitle>
          <DialogDescription>Rodada {game.rodada} · {game.timeCasa} × {game.timeFora}. Após confirmar o placar final, o jogo ficará bloqueado para alterações.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={event => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {(["home", "away"] as const).map((name, index) => <form.Field key={name} name={name}>{field => <div className="space-y-2">
              <Label htmlFor={`result-${name}`}>{index === 0 ? `${game.timeCasa} (casa)` : `${game.timeFora} (fora)`}</Label>
              <Input id={`result-${name}`} type="text" inputMode="numeric" maxLength={3}
                value={field.state.value} onChange={event => field.handleChange(event.target.value)} onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0} aria-describedby={`result-${name}-error`} disabled={busy || Boolean(result)} />
              <FieldErrors id={`result-${name}-error`} errors={field.state.meta.errors} />
            </div>}</form.Field>)}
          </div>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={busy || Boolean(result) || !schema.safeParse(values).success}>{busy ? "Salvando…" : "Confirmar resultado"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
