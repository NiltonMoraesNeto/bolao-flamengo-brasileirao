import { correctionReasonSchema, predictionDraftFormSchema } from "./form-schemas.ts";
import type { PredictionDraft, StoredPrediction } from "./form-schemas.ts";
export type { PredictionDraft, StoredPrediction } from "./form-schemas.ts";

export interface PredictionChange {
  usuario: string;
  jogoId: string;
  golsCasa: number;
  golsFora: number;
  original?: StoredPrediction;
}

export function createPredictionDraft(
  participants: { id: string; nome: string }[],
  predictions: StoredPrediction[],
): PredictionDraft[] {
  const byName = new Map(predictions.map(prediction => [prediction.usuario, prediction]));
  return participants.map(participant => {
    const original = byName.get(participant.nome);
    return {
      participantId: participant.id,
      usuario: participant.nome,
      golsCasa: original ? String(original.golsCasa) : "",
      golsFora: original ? String(original.golsFora) : "",
      original,
    };
  });
}

export function preparePredictionBatch(draft: PredictionDraft[], gameId: string) {
  const changes: PredictionChange[] = [];
  const errors: Record<string, string> = {};
  const validation = predictionDraftFormSchema.safeParse({ rows: draft });
  if (!validation.success) {
    for (const issue of validation.error.issues) {
      const index = issue.path[1];
      const key = typeof index === "number" ? draft[index]?.participantId : "form";
      if (key) errors[key] = issue.message;
    }
  }
  for (const row of draft) {
    const home = row.golsCasa.trim();
    const away = row.golsFora.trim();
    if (!home && !away && !row.original) continue;
    if (errors[row.participantId]) continue;
    const golsCasa = Number(home);
    const golsFora = Number(away);
    if (row.original?.golsCasa === golsCasa && row.original.golsFora === golsFora) continue;
    changes.push({ usuario: row.usuario, jogoId: gameId, golsCasa, golsFora, original: row.original });
  }
  return { changes, errors };
}

export function isValidCorrectionReason(reason: string): boolean {
  return correctionReasonSchema.safeParse(reason).success;
}
