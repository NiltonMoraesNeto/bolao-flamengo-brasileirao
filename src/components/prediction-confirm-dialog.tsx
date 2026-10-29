import { useState } from "react";
import type { ReactNode } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { correctionFormSchema } from "../domain/form-schemas";
import { predictionErrorMessage } from "../services/prediction-grid";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { CorrectionReasonField } from "./correction-reason-field";
import { FieldErrors } from "./field-errors";

export function PredictionConfirmDialog({ title, description, children, requiresReason, confirmLabel, cancelLabel = "Cancelar", onConfirm, onClose }: {
  title: string; description: string; children?: ReactNode; requiresReason: boolean;
  confirmLabel: string; cancelLabel?: string; onConfirm: (reason: string) => Promise<void>; onClose: () => void;
}) {
  const [error, setError] = useState("");
  const schema = correctionFormSchema(requiresReason);
  const form = useForm({
    defaultValues: { reason: "" }, validators: { onChange: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError("");
      try { await onConfirm(value.reason.trim()); }
      catch (error) { setError(predictionErrorMessage(error)); }
    },
  });
  const busy = useStore(form.store, state => state.isSubmitting);
  const value = useStore(form.store, state => state.values);
  return (
    <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"
        onInteractOutside={event => { if (busy) event.preventDefault(); }}
        onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <form noValidate onSubmit={event => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }} className="space-y-4">
          {children}
          {requiresReason && <form.Field name="reason">{field => <div>
            <CorrectionReasonField value={field.state.value} onChange={field.handleChange} onBlur={field.handleBlur} disabled={busy} />
            <FieldErrors errors={field.state.meta.errors} />
          </div>}</form.Field>}
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={onClose}>{cancelLabel}</Button>
            <Button type="submit" variant="destructive" disabled={busy || !schema.safeParse(value).success}>{busy ? "Salvando…" : confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
