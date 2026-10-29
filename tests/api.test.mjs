import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../server/app.ts";
import { UpstreamError } from "../server/supabase.ts";

test("API valida sessão, restringe administrador e encaminha um único lote", async () => {
  const calls = [];
  const gateway = {
    async request(path, token, body) {
      calls.push({ path, token, body });
      if (path.startsWith("/auth/v1/token")) return { access_token: "admin", user: { id: "owner" } };
      if (path === "/auth/v1/user") {
        if (token === "expired") throw new UpstreamError(401);
        if (token === "offline") throw new UpstreamError(503);
        return { id: token === "admin" ? "owner" : "other" };
      }
      if (path.startsWith("/rest/v1/admins")) return token === "admin" ? [{ user_id: "owner" }] : [];
      if (path.includes("/rpc/save_predictions")) return [{ id: "saved" }];
      return [];
    },
  };
  const server = createApp(gateway, {
    origin: "http://localhost:5173", season: 2026,
    loginLimiter: { async consume() { return 0; } },
  }).listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const request = (path, token, body, method = body ? "POST" : "GET") => fetch(`${base}${path}`, {
      method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    assert.equal((await request("/health")).status, 200);
    for (const [token, status] of [[undefined, 401], ["expired", 401], ["other", 403], ["offline", 503]]) {
      assert.equal((await request("/jogos/list", token)).status, status);
    }
    const login = await request("/usuarios/login", undefined, { email: "admin@example.com", password: "test" });
    assert.deepEqual(await login.json(), { token: "admin" });
    assert.equal((await request("/usuarios/login", undefined, { email: "invalid", password: "x" })).status, 400);
    const row = { usuario: "AMIGO", jogoId: "1", golsCasa: 2, golsFora: 1 };
    assert.equal((await request("/palpites/batch", "admin", { rows: [row] })).status, 200);
    const rpc = calls.filter(c => c.path.includes("/rpc/save_predictions"));
    assert.equal(rpc.length, 1);
    assert.deepEqual(rpc[0].body, { p_season: 2026, p_rows: [row], p_reason: null });
    assert.equal((await request("/palpites/batch", "admin", { rows: [row, row] })).status, 400);
    assert.equal((await request("/palpites/new", "admin", { ...row, golsCasa: -1 })).status, 400);
    assert.deepEqual(await (await request("/palpitesById?jogoId=1", "admin")).json(), []);
    assert.equal((await request("/palpitesById", "admin")).status, 400);
    assert.equal((await request("/jogosEdit/1", "admin", { golsCasa: 2 }, "PUT")).status, 404);
    const response = await request("/jogos/list", "admin");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.ok(response.headers.get("x-request-id"));
  } finally {
    if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("API limita tentativas de login", async () => {
  const gateway = { async request() { throw new UpstreamError(400); } };
  let attempts = 0;
  const server = createApp(gateway, {
    origin: "http://localhost:5173", season: 2026,
    loginLimiter: { async consume() { return ++attempts <= 10 ? 0 : 900; } },
  }).listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const url = `http://127.0.0.1:${server.address().port}/api/usuarios/login`;
    for (let i = 0; i < 11; i++) {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@example.com", password: "wrong" }) });
      assert.equal(response.status, i < 10 ? 401 : 429);
      await response.text();
    }
  } finally {
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
});
