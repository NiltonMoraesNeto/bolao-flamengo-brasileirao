import { test } from "node:test";
import assert from "node:assert/strict";
import { convertLegacy, normalizeDate } from "../server/legacy.ts";
import { batchSchema } from "../server/contracts.ts";

const fixture = () => ({
  login: [{ email: "privado@example.com", password: "SEGREDO-NAO-EXPORTAR", cep: "00000000" }],
  usuarios: [{ id: 1, nome: "D'AMIGO" }],
  jogos: [{ id: "1", rodada: 1, data: "2026-10-29 19:00", timeCasa: "Flamengo", timeFora: "Vasco" }],
  palpites: [{ id: "p1", jogoId: 1, usuario: "D'AMIGO", golsCasa: 2, golsFora: 1 }],
  resultados: [{ id: "1", golsCasa: 2, golsFora: 0 }],
});
test("importação normaliza IDs e datas e exclui credenciais", () => {
  const input = fixture();
  const before = JSON.stringify(input);
  const output = convertLegacy(input, 2026);
  assert.match(output.sql, /D''AMIGO/);
  assert.match(output.sql, /2026:p1/);
  assert.doesNotMatch(output.sql, /SEGREDO|password|privado@example|cep/);
  assert.equal(output.summary.predictions, 1);
  assert.equal(JSON.stringify(input), before);
  assert.equal(normalizeDate(input.jogos[0].data), "2026-10-29T22:00:00.000Z");
  assert.equal(normalizeDate("2026-10-29T22:00:00Z"), "2026-10-29T22:00:00.000Z");
});
test("importação recusa órfãos, duplicatas, placares inválidos e temporada errada", () => {
  const orphan = fixture(); orphan.palpites[0].jogoId = 99;
  assert.throws(() => convertLegacy(orphan, 2026));
  const duplicate = fixture(); duplicate.palpites.push({ ...duplicate.palpites[0], id: "p2" });
  assert.throws(() => convertLegacy(duplicate, 2026));
  const invalid = fixture(); invalid.palpites[0].golsCasa = -1;
  assert.throws(() => convertLegacy(invalid, 2026));
  assert.throws(() => convertLegacy(fixture(), 2025));
});
test("contrato de lote recusa campos extras, repetição e gols fracionários", () => {
  const row = { usuario: "AMIGO", jogoId: "1", golsCasa: 2, golsFora: 1 };
  assert.equal(batchSchema.safeParse({ rows: [row] }).success, true);
  for (const rows of [[], [row, row], [{ ...row, golsCasa: 1.5 }], [{ ...row, id: "injetado" }]]) {
    assert.equal(batchSchema.safeParse({ rows }).success, false);
  }
});
