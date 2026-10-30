import axios from "axios";
import { z } from "zod";
import api from "./api";
import type { PredictionChange, StoredPrediction } from "../domain/prediction-batch";
import { storedPredictionSchema, SubmissionError } from "../domain/form-schemas";
import { queryOptions } from "@tanstack/react-query";
import { bolaoKeys } from "../lib/query-client";

const goals = z.number().int().min(0).max(99);
const participant = z.object({ id: z.string(), nome: z.string() });
const game = z.object({
  id: z.string(), rodada: z.number().int(), data: z.string().refine(value => Number.isFinite(Date.parse(value))),
  timeCasa: z.string(), timeFora: z.string(),
  placar: z.string().nullish().transform(value => value ?? undefined),
  resultado: z.string().nullish().transform(value => value ?? undefined),
});
const prediction = storedPredictionSchema;
const result = z.object({ id: z.string(), golsCasa: goals, golsFora: goals });
const savedPrediction = z.object({
  id: z.string(), game_id: z.string(), participant_id: z.string(), gols_casa: goals, gols_fora: goals,
});

export type GridGame = z.infer<typeof game>;
export type GridParticipant = z.infer<typeof participant>;
export type GridResult = z.infer<typeof result>;

export const gamesQuery = queryOptions({
  queryKey: bolaoKeys.games,
  queryFn: async ({ signal }) => z.array(game).parse((await api.get<unknown>("/jogos/list", { signal })).data),
});
export const participantsQuery = queryOptions({
  queryKey: bolaoKeys.participants,
  queryFn: async ({ signal }) => z.array(participant).parse((await api.get<unknown>("/usuarios/list", { signal })).data),
});
export const predictionsQuery = queryOptions({
  queryKey: bolaoKeys.predictions,
  queryFn: async ({ signal }) => z.array(prediction).parse((await api.get<unknown>("/palpites/list", { signal })).data),
});
export const resultsQuery = queryOptions({
  queryKey: bolaoKeys.results,
  queryFn: async ({ signal }) => z.array(result).parse((await api.get<unknown>("/resultados/list", { signal })).data),
});

export async function loadPredictionGame(gameId: string, signal?: AbortSignal) {
  const [predictions, actualResult] = await Promise.all([
    api.get<unknown>("/palpitesById", { params: { jogoId: gameId }, signal }),
    api.get<unknown>("/resultadosById", { params: { id: gameId }, signal }),
  ]);
  return { predictions: z.array(prediction).parse(predictions.data), result: result.nullable().parse(actualResult.data) };
}

export const predictionGameQuery = (gameId: string) => queryOptions({
  queryKey: bolaoKeys.game(gameId),
  queryFn: ({ signal }) => loadPredictionGame(gameId, signal),
});
export type PredictionGameData = Awaited<ReturnType<typeof loadPredictionGame>>;

export async function savePredictionBatch(
  changes: PredictionChange[], participants: GridParticipant[], correctionReason?: string,
): Promise<StoredPrediction[]> {
  const response = await api.post<unknown>("/palpites/batch", {
    rows: changes.map(({ usuario, jogoId, golsCasa, golsFora }) => ({ usuario, jogoId, golsCasa, golsFora })),
    ...(correctionReason ? { correctionReason: correctionReason.trim() } : {}),
  });
  const names = new Map(participants.map(p => [p.id, p.nome]));
  const saved = z.array(savedPrediction).length(changes.length).parse(response.data);
  return saved.map(row => {
    const usuario = names.get(row.participant_id);
    if (!usuario) throw new Error("Participante desconhecido na resposta");
    return { id: row.id, usuario, jogoId: row.game_id, golsCasa: row.gols_casa, golsFora: row.gols_fora };
  });
}

export async function removeGridPrediction(id: string, correctionReason?: string) {
  await api.delete(`/palpitesDelete/${encodeURIComponent(id)}`, {
    data: correctionReason ? { correctionReason: correctionReason.trim() } : {},
  });
}

export async function saveGridResult(value: GridResult, correctionReason?: string) {
  await api.post("/resultados/new", { ...value, ...(correctionReason ? { correctionReason: correctionReason.trim() } : {}) });
}

export function predictionErrorMessage(error: unknown, operation: "load" | "save" = "save"): string {
  if (error instanceof SubmissionError) return error.message;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "Sua sessão expirou. Entre novamente.";
    if (status === 403) return "Sua conta não tem permissão para esta operação.";
    if (status === 409) return "O banco recusou a operação. Palpites só podem ser alterados antes do início do jogo, e resultados finais não podem ser corrigidos. Confira também os dados enviados.";
    if (!error.response || status === 503) return operation === "load"
      ? "Não foi possível carregar os dados. Confira a conexão e tente novamente."
      : "Não foi possível confirmar a operação. Confira a conexão e tente novamente. Seus campos foram mantidos.";
  }
  return operation === "load" ? "Não foi possível carregar os dados. Tente novamente."
    : "Não foi possível concluir a operação. Seus campos foram mantidos; tente novamente.";
}
