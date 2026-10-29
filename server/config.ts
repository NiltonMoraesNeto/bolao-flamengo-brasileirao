import { z } from "zod";

const config = z.object({
  SUPABASE_URL: z.string().url().refine(value => value.startsWith("https://"), "Use HTTPS"),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  FRONTEND_ORIGIN: z.string().url().optional(),
  ACTIVE_SEASON: z.coerce.number().int().min(2000).max(2100).default(2026),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
});

export function readConfig(environment: NodeJS.ProcessEnv) {
  const parsed = config.safeParse(environment);
  if (!parsed.success) {
    // Não inclui valores de ambiente ou credenciais na mensagem.
    throw new Error(`Configuração inválida. Confira: ${parsed.error.issues.map(i => i.path.join(".")).join(", ")}`);
  }
  return parsed.data;
}
