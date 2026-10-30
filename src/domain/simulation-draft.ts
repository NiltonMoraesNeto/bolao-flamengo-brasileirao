import { simulationPredictionRowSchema } from "./form-schemas.ts";
import type { SimulationDraftRow } from "./form-schemas.ts";
import type { RankingPrediction } from "./standings.ts";

export function createSimulationDraft(
  participants: readonly { id: string; nome: string }[], predictions: readonly RankingPrediction[], gameId: string,
): SimulationDraftRow[] {
  const saved = new Map(predictions.filter(row => row.jogoId === gameId).map(row => [row.usuario, row]));
  return participants.map(participant => {
    const prediction = saved.get(participant.nome);
    return { participantId: participant.id, usuario: participant.nome,
      golsCasa: prediction ? String(prediction.golsCasa) : "", golsFora: prediction ? String(prediction.golsFora) : "" };
  });
}

export function scenarioPredictions(rows: readonly SimulationDraftRow[], gameId: string): RankingPrediction[] {
  return rows.flatMap(row => {
    const parsed = simulationPredictionRowSchema.parse(row);
    if (!parsed.golsCasa.trim() && !parsed.golsFora.trim()) return [];
    return [{ usuario: parsed.usuario, jogoId: gameId,
      golsCasa: Number(parsed.golsCasa.trim()), golsFora: Number(parsed.golsFora.trim()) }];
  });
}
