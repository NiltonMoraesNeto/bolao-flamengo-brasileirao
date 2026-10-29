import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bolaoKeys } from "../lib/query-client";
import { removeGridPrediction, saveGridResult, savePredictionBatch } from "../services/prediction-grid";
import type { GridParticipant, GridResult, PredictionGameData } from "../services/prediction-grid";
import type { PredictionChange } from "../domain/prediction-batch";

export function useSavePredictionBatch(gameId: string, participants: GridParticipant[]) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ changes, reason }: { changes: PredictionChange[]; reason?: string }) =>
      savePredictionBatch(changes, participants, reason),
    onSuccess: saved => {
      const names = new Set(saved.map(row => row.usuario));
      client.setQueryData<PredictionGameData>(bolaoKeys.game(gameId), current => current ? {
        ...current, predictions: [...current.predictions.filter(row => !names.has(row.usuario)), ...saved],
      } : current);
      void client.invalidateQueries({ queryKey: bolaoKeys.predictions });
    },
  });
}

export function useRemovePrediction(gameId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => removeGridPrediction(id, reason),
    onSuccess: (_data, { id }) => {
      client.setQueryData<PredictionGameData>(bolaoKeys.game(gameId), current => current ? {
        ...current, predictions: current.predictions.filter(row => row.id !== id),
      } : current);
      void client.invalidateQueries({ queryKey: bolaoKeys.predictions });
    },
  });
}

export function useSaveGameResult(gameId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ value, reason }: { value: GridResult; reason?: string }) => saveGridResult(value, reason),
    onSuccess: (_data, { value }) => {
      client.setQueryData<PredictionGameData>(bolaoKeys.game(gameId), current => current ? { ...current, result: value } : current);
      void client.invalidateQueries({ queryKey: bolaoKeys.results });
      void client.invalidateQueries({ queryKey: bolaoKeys.games });
    },
  });
}
