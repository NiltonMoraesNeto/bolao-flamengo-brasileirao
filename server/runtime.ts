import { createApp } from "./app.ts";
import { readConfig } from "./config.ts";
import { createLoginLimiter } from "./login-limiter.ts";
import { createSupabaseGateway } from "./supabase.ts";

export function createRuntimeApp(environment = process.env) {
  const env = readConfig(environment);
  const gateway = createSupabaseGateway(env.SUPABASE_URL.replace(/\/$/, ""), env.SUPABASE_PUBLISHABLE_KEY);
  return createApp(gateway, {
    origin: env.FRONTEND_ORIGIN,
    season: env.ACTIVE_SEASON,
    vercel: environment.VERCEL === "1",
    loginLimiter: createLoginLimiter(gateway),
  });
}
