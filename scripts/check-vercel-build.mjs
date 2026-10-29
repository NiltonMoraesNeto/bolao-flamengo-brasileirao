import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";

// Valida o artefato real, incluindo resolução dos imports após compilar TS em JS.
// Não lê .env nem acessa Supabase; health e autenticação ausente são locais.
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "x".repeat(32);
process.env.ACTIVE_SEASON = "2026";
delete process.env.FRONTEND_ORIGIN;
const { default: app } = await import("../.vercel/output/functions/api/index.func/api/index.js");
const server = app.listen(0, "127.0.0.1");
try {
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  const protectedRoute = await fetch(`${base}/api/jogos/list`);
  assert.equal(protectedRoute.status, 401);
  assert.match(protectedRoute.headers.get("content-type"), /json/);
  const output = readFileSync(new URL("../.vercel/output/static/index.html", import.meta.url), "utf8");
  assert.match(output, /<html/);
  console.log("Artefato Vercel: função inicializa, health 200, dados protegidos 401 e frontend presente.");
} finally {
  await new Promise(resolve => server.close(resolve));
}
