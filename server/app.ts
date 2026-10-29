import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";
import { batchSchema, correctionReason, entityId, loginSchema, predictionSchema, resultSchema } from "./contracts.ts";
import { UpstreamError } from "./supabase.ts";
import type { SupabaseGateway } from "./supabase.ts";
import type { LoginLimiter } from "./login-limiter.ts";

export function createApp(gateway: SupabaseGateway, options: {
  origin?: string; season: number; vercel?: boolean; loginLimiter: LoginLimiter;
}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY" });
    res.locals.requestId = randomUUID();
    res.set("X-Request-ID", res.locals.requestId);
    next();
  });
  app.use(cors({ origin: options.origin ?? false }));
  app.use(express.json({ limit: "256kb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.post("/api/usuarios/login", async (req, res, next) => {
    try {
      const credentials = loginSchema.parse(req.body);
      // Só a Vercel pode fornecer este header confiável. Localmente é ignorado.
      const forwarded = options.vercel ? req.get("x-vercel-forwarded-for")?.trim() : undefined;
      const address = forwarded && isIP(forwarded) ? forwarded : req.ip ?? "unknown";
      const retryAfter = await options.loginLimiter.consume(address);
      if (retryAfter > 0) {
        res.set("Retry-After", String(retryAfter));
        res.status(429).json({ error: "Muitas tentativas. Tente novamente mais tarde." });
        return;
      }
      const session = z.object({ access_token: z.string(), user: z.object({ id: z.string() }) })
        .parse(await gateway.request("/auth/v1/token?grant_type=password", undefined, credentials));
      const admins = z.array(z.object({ user_id: z.string() })).parse(await gateway.request(
        `/rest/v1/admins?select=user_id&user_id=eq.${encodeURIComponent(session.user.id)}`, session.access_token,
      ));
      if (!admins.length) {
        res.status(403).json({ error: "Acesso restrito ao administrador" });
        return;
      }
      res.json({ token: session.access_token });
    } catch (error) {
      if (error instanceof UpstreamError && [400, 401, 403].includes(error.status)) {
        res.status(401).json({ error: "Email ou senha inválidos" });
      } else next(error);
    }
  });

  app.use("/api", async (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) {
      res.status(401).json({ error: "Autenticação obrigatória" });
      return;
    }
    try {
      const user = z.object({ id: z.string() }).parse(await gateway.request("/auth/v1/user", token));
      const admins = z.array(z.object({ user_id: z.string() })).parse(await gateway.request(
        `/rest/v1/admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`, token,
      ));
      if (!admins.length) {
        res.status(403).json({ error: "Acesso restrito ao administrador" });
        return;
      }
      res.locals.token = token;
      next();
    } catch (error) {
      if (error instanceof UpstreamError && [400, 401, 403].includes(error.status)) {
        res.status(401).json({ error: "Sessão inválida ou expirada" });
      } else next(error);
    }
  });

  const route = (handler: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => { void handler(req, res).catch(next); };
  const read = (name: string, filter = "") =>
    `/rest/v1/${name}?select=*&season_id=eq.${options.season}${filter}`;

  app.get("/api/jogos/list", route(async (_req, res) => {
    res.json(await gateway.request(read("games_view", "&order=rodada"), res.locals.token));
  }));
  app.get("/api/jogosById", route(async (req, res) => {
    const id = entityId.parse(req.query.id);
    const rows = z.array(z.unknown()).parse(await gateway.request(read("games_view", `&id=eq.${encodeURIComponent(id)}`), res.locals.token));
    res.status(rows.length ? 200 : 404).json(rows[0] ?? { error: "Jogo não encontrado" });
  }));
  app.get("/api/usuarios/list", route(async (_req, res) => {
    res.json(await gateway.request(read("participants", "&order=nome"), res.locals.token));
  }));
  app.get("/api/palpites/list", route(async (_req, res) => {
    res.json(await gateway.request(read("predictions_view"), res.locals.token));
  }));
  for (const path of ["/api/palpitesById", "/api/palpitesByIdAndUser"]) {
    app.get(path, route(async (req, res) => {
      const id = entityId.parse(req.query.jogoId);
      const user = req.query.usuario === undefined ? "" : `&usuario=eq.${encodeURIComponent(z.string().parse(req.query.usuario))}`;
      res.json(await gateway.request(read("predictions_view", `&jogoId=eq.${encodeURIComponent(id)}${user}`), res.locals.token));
    }));
  }
  app.get("/api/resultados/list", route(async (_req, res) => {
    res.json(await gateway.request(read("results_view"), res.locals.token));
  }));
  app.get("/api/resultadosById", route(async (req, res) => {
    const id = entityId.parse(req.query.id);
    const rows = z.array(z.unknown()).parse(await gateway.request(read("results_view", `&id=eq.${encodeURIComponent(id)}`), res.locals.token));
    // Ausência é normal antes do jogo; mantém a resposta falsa esperada pelo frontend.
    res.json(rows[0] ?? null);
  }));
  app.post("/api/palpites/new", route(async (req, res) => {
    const row = predictionSchema.parse(req.body);
    const data = await gateway.request("/rest/v1/rpc/save_predictions", res.locals.token,
      { p_season: options.season, p_rows: [row], p_reason: null });
    res.status(201).json(data);
  }));
  app.post("/api/palpites/batch", route(async (req, res) => {
    const input = batchSchema.parse(req.body);
    res.json(await gateway.request("/rest/v1/rpc/save_predictions", res.locals.token,
      { p_season: options.season, p_rows: input.rows, p_reason: input.correctionReason ?? null }));
  }));
  app.delete("/api/palpitesDelete/:palpiteId", route(async (req, res) => {
    const id = entityId.parse(req.params.palpiteId);
    const reason = z.object({ correctionReason }).strict().parse(req.body ?? {}).correctionReason;
    await gateway.request("/rest/v1/rpc/delete_prediction", res.locals.token,
      { p_season: options.season, p_id: id, p_reason: reason ?? null });
    res.json({ deleted: true });
  }));
  app.post("/api/resultados/new", route(async (req, res) => {
    const input = resultSchema.parse(req.body);
    await gateway.request("/rest/v1/rpc/save_result", res.locals.token,
      { p_season: options.season, p_game: input.id, p_home: input.golsCasa,
        p_away: input.golsFora, p_reason: input.correctionReason ?? null });
    res.json("Resultado inserido com sucesso");
  }));
  app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada" }));
  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) { next(error); return; }
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", fields: error.issues.map(i => ({ path: i.path, message: i.message })) });
    } else if (error instanceof UpstreamError) {
      const conflict = ["23505", "23503", "P0001"].includes(error.code ?? "");
      const status = conflict ? 409 : error.status === 403 ? 403 : error.status === 401 ? 401 : 503;
      res.status(status).json({ error: conflict ? "Operação recusada: confira referências, prazo e justificativa de correção." : "Serviço indisponível ou acesso recusado", requestId: res.locals.requestId });
    } else if (error instanceof SyntaxError) {
      res.status(400).json({ error: "JSON inválido" });
    } else if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
      res.status(413).json({ error: "Requisição muito grande" });
    } else {
      console.error("Falha interna", res.locals.requestId);
      res.status(500).json({ error: "Erro interno", requestId: res.locals.requestId });
    }
  });
  return app;
}
