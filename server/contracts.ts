import { z } from "zod";

export const entityId = z.union([z.string().trim().min(1).max(100), z.number().int().nonnegative()]).transform(String);
export const goals = z.number().int().min(0).max(99);
export const predictionSchema = z.object({
  usuario: z.string().trim().min(1).max(150), jogoId: entityId,
  golsCasa: goals, golsFora: goals,
}).strict();
export const correctionReason = z.string().trim().min(8).max(500).optional();
export const batchSchema = z.object({
  rows: z.array(predictionSchema).min(1).max(200), correctionReason,
}).strict().superRefine(({ rows }, ctx) => {
  const keys = rows.map(row => JSON.stringify([row.jogoId, row.usuario]));
  if (new Set(keys).size !== keys.length) {
    ctx.addIssue({ code: "custom", message: "Participante e jogo repetidos no lote" });
  }
});
export const resultSchema = z.object({
  id: entityId, golsCasa: goals, golsFora: goals, correctionReason,
}).strict();
export const loginSchema = z.object({
  email: z.string().email().max(254), password: z.string().min(1).max(1024),
}).strict();

export type PredictionInput = z.infer<typeof predictionSchema>;
