import { z } from "zod";
import { entityId, goals } from "./contracts.ts";

const schema = z.object({
  usuarios: z.array(z.object({ id: entityId, nome: z.string().min(1) })),
  jogos: z.array(z.object({ id: entityId, rodada: z.number().int().positive(), data: z.string(),
    timeCasa: z.string().min(1), timeFora: z.string().min(1) })),
  palpites: z.array(z.object({ id: z.string().min(1), jogoId: entityId, usuario: z.string(), golsCasa: goals, golsFora: goals })),
  resultados: z.array(z.object({ id: entityId, golsCasa: goals, golsFora: goals })),
});
const quote = (value: string | number) => `'${String(value).replaceAll("'", "''")}'`;
const insert = (table: string, values: (string | number)[]) => `insert into public.${table} values (${values.map(quote).join(", ")});`;

export function normalizeDate(value: string): string {
  const local = value.replace(" ", "T");
  const withOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(local) ? local : `${local}-03:00`;
  const date = new Date(withOffset);
  if (!Number.isFinite(date.getTime())) throw new Error("Data inválida");
  return date.toISOString();
}

export function convertLegacy(input: unknown, season: number) {
  // O schema remove login, senha, CEP e qualquer campo fora das entidades do bolão.
  const data = schema.parse(input);
  const statements = [insert("seasons (id)", [season])];
  const users = new Map(data.usuarios.map(p => [p.nome, p.id]));
  const gameIds = new Set(data.jogos.map(g => g.id));
  const unique = (keys: string[]) => {
    if (new Set(keys).size !== keys.length) throw new Error("Duplicata na origem");
  };
  unique(data.usuarios.map(p => p.id)); unique(data.usuarios.map(p => p.nome));
  unique(data.jogos.map(g => g.id)); unique(data.resultados.map(r => r.id));
  unique(data.palpites.map(p => p.id));
  unique(data.palpites.map(p => JSON.stringify([p.jogoId, p.usuario])));
  for (const p of data.usuarios) statements.push(insert("participants (season_id, id, nome)", [season, p.id, p.nome]));
  for (const g of data.jogos) {
    if (!g.data.startsWith(`${season}-`)) throw new Error("Temporada não corresponde à origem");
    statements.push(insert("games (season_id, id, rodada, data, time_casa, time_fora)",
      [season, g.id, g.rodada, normalizeDate(g.data), g.timeCasa, g.timeFora]));
  }
  for (const r of data.resultados) {
    if (!gameIds.has(r.id)) throw new Error("Resultado sem jogo");
    statements.push(insert("results (season_id, game_id, gols_casa, gols_fora)", [season, r.id, r.golsCasa, r.golsFora]));
  }
  for (const p of data.palpites) {
    const user = users.get(p.usuario);
    if (!user || !gameIds.has(p.jogoId)) throw new Error("Palpite sem participante ou jogo");
    statements.push(insert("predictions (id, season_id, game_id, participant_id, gols_casa, gols_fora)",
      [`${season}:${p.id}`, season, p.jogoId, user, p.golsCasa, p.golsFora]));
  }
  return { sql: statements.join("\n"), summary: { season, participants: data.usuarios.length,
    games: data.jogos.length, predictions: data.palpites.length, results: data.resultados.length } };
}
