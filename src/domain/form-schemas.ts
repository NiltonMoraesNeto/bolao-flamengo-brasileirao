import { z } from "zod";

export class SubmissionError extends Error {}

export const storedPredictionSchema = z.object({
  id: z.string(), usuario: z.string(), jogoId: z.string(),
  golsCasa: z.number().int().min(0).max(99), golsFora: z.number().int().min(0).max(99),
});

export const correctionReasonSchema = z.string().trim().min(8, "Use pelo menos 8 caracteres.").max(500, "Use até 500 caracteres.");
export const loginFormSchema = z.object({
  email: z.string().trim().email("Informe um email válido.").max(254),
  password: z.string().min(1, "Informe sua senha.").max(1024),
});

export const predictionDraftRowSchema = z.object({
  participantId: z.string(), usuario: z.string(), golsCasa: z.string(), golsFora: z.string(),
  original: storedPredictionSchema.optional(),
}).superRefine((row, context) => {
  const home = row.golsCasa.trim();
  const away = row.golsFora.trim();
  if (!home && !away && !row.original) return;
  let message: string | undefined;
  if (!home || !away) {
    message = row.original && !home && !away
      ? "Para remover um palpite salvo, use o botão de exclusão."
      : "Preencha os dois placares ou deixe ambos vazios.";
  } else if (!/^\d{1,2}$/.test(home) || !/^\d{1,2}$/.test(away)) {
    message = "Use gols inteiros de 0 a 99.";
  }
  if (message) {
    context.addIssue({ code: "custom", path: ["golsCasa"], message });
    context.addIssue({ code: "custom", path: ["golsFora"], message });
  }
});

export const predictionDraftFormSchema = z.object({ rows: z.array(predictionDraftRowSchema).min(1).max(200) });

export function correctionFormSchema(required: boolean) {
  return z.object({ reason: required ? correctionReasonSchema : z.string().max(500) });
}

const scoreInput = z.string().regex(/^\d{1,2}$/, "Use gols inteiros de 0 a 99.");
export const simulationFormSchema = z.object({ home: scoreInput, away: scoreInput });

export const simulationPredictionRowSchema = z.object({
  participantId: z.string(), usuario: z.string(), golsCasa: z.string(), golsFora: z.string(),
}).superRefine((row, context) => {
  const home = row.golsCasa.trim();
  const away = row.golsFora.trim();
  if (!home && !away) return;
  const message = !home || !away ? "Preencha os dois gols ou deixe ambos vazios."
    : !/^\d{1,2}$/.test(home) || !/^\d{1,2}$/.test(away) ? "Use gols inteiros de 0 a 99." : null;
  if (message) {
    context.addIssue({ code: "custom", path: ["golsCasa"], message });
    context.addIssue({ code: "custom", path: ["golsFora"], message });
  }
});
export const simulationScenarioSchema = simulationFormSchema.extend({
  rows: z.array(simulationPredictionRowSchema).min(1).max(200),
});
export type SimulationDraftRow = z.infer<typeof simulationPredictionRowSchema>;

export function resultFormSchema(isCorrection: boolean) {
  return z.object({ home: scoreInput, away: scoreInput, reason: isCorrection ? correctionReasonSchema : z.string() });
}

export type StoredPrediction = z.infer<typeof storedPredictionSchema>;
export type PredictionDraft = z.infer<typeof predictionDraftRowSchema>;
