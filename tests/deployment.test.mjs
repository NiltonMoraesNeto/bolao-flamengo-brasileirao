import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readConfig } from "../server/config.ts";
import { createApp } from "../server/app.ts";
import { createLoginLimiter } from "../server/login-limiter.ts";
import { UpstreamError } from "../server/supabase.ts";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("configuração não vaza valores e aceita deploy sem origem fixa", () => {
  const env = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "x".repeat(30) };
  assert.equal(readConfig(env).ACTIVE_SEASON, 2026);
  assert.equal(readConfig(env).FRONTEND_ORIGIN, undefined);
  assert.throws(() => readConfig({ ...env, SUPABASE_URL: "SECRET_VALUE" }), error => {
    assert.ok(error.message.includes("SUPABASE_URL"));
    assert.ok(!error.message.includes("SECRET_VALUE"));
    return true;
  });
});

test("limite de login no PostgreSQL: instâncias compartilham tentativas e anônimo não reinicia contagem", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; grant usage on schema public to anon, authenticated;");
    await db.exec(readFileSync(new URL("../supabase/migrations/202610290002_login_rate_limit.sql", import.meta.url), "utf8"));
    const keys = [];
    const gateway = { async request(path, token, body) {
      assert.equal(path, "/rest/v1/rpc/consume_login_attempt");
      assert.equal(token, undefined);
      assert.match(body.p_key, /^[a-f0-9]{64}$/);
      assert.ok(!body.p_key.includes("192.0.2.1"));
      keys.push(body.p_key);
      return (await db.query("select public.consume_login_attempt($1) as retry", [body.p_key])).rows[0].retry;
    } };
    const firstInstance = createLoginLimiter(gateway);
    const secondInstance = createLoginLimiter(gateway);
    await db.exec("set role anon");
    for (let i = 0; i < 10; i++) {
      assert.equal(await (i % 2 ? firstInstance : secondInstance).consume("192.0.2.1"), 0);
    }
    assert.ok(await createLoginLimiter(gateway).consume("192.0.2.1") > 0, "nova instância continua bloqueada");
    assert.equal(await secondInstance.consume("192.0.2.2"), 0, "IPs independentes");
    await assert.rejects(db.query("select * from public.login_rate_limits"));
    await assert.rejects(db.query("delete from public.login_rate_limits"));
    await assert.rejects(db.query("select public.consume_login_attempt('invalid')"));
    await db.exec("reset role");
    await db.query("update public.login_rate_limits set expires_at = now() - interval '1 second' where bucket = $1", [keys[0]]);
    await db.exec("set role authenticated");
    assert.equal(await firstInstance.consume("192.0.2.1"), 0, "janela vencida reabre acesso");
  } finally {
    await db.close();
  }
});

test("API usa IP da Vercel somente na Vercel e falha fechada sem limitador remoto", async () => {
  for (const vercel of [false, true]) {
    const addresses = [];
    const server = createApp({ async request() { throw new UpstreamError(400); } }, {
      season: 2026, vercel,
      loginLimiter: { async consume(address) {
        addresses.push(address);
        if (addresses.length === 2) throw new UpstreamError(503);
        return 0;
      } },
    }).listen(0, "127.0.0.1");
    try {
      await once(server, "listening");
      const base = `http://127.0.0.1:${server.address().port}`;
      const request = () => fetch(`${base}/api/usuarios/login`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-vercel-forwarded-for": "192.0.2.1" },
        body: JSON.stringify({ email: "admin@example.com", password: "wrong" }),
      });
      assert.equal((await request()).status, 401);
      assert.equal(addresses[0], vercel ? "192.0.2.1" : "127.0.0.1");
      assert.equal((await request()).status, 503);
      const unknown = await fetch(`${base}/api/unknown`);
      assert.equal(unknown.status, 401);
      assert.match(unknown.headers.get("content-type"), /json/);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  }
});
