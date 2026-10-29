import { useId } from "react";
import { Label } from "./ui/label";

export function CorrectionReasonField({ value, onChange, onBlur, disabled = false }: {
  value: string; onChange: (value: string) => void; onBlur?: () => void; disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Justificativa da correção</Label>
      <textarea id={id} value={value} onChange={event => onChange(event.target.value)} onBlur={onBlur}
        disabled={disabled} minLength={8} maxLength={500} required rows={3}
        aria-describedby={`${id}-help`}
        className="w-full rounded-md border border-input bg-background p-3 text-base lg:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Ex.: transcrição de palpites enviados antes do início do jogo" />
      <p id={`${id}-help`} className="text-xs text-muted-foreground">
        Use de 8 a 500 caracteres. A justificativa ficará no histórico da alteração.
      </p>
    </div>
  );
}
