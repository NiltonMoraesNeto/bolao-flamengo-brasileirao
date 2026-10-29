import { test } from "node:test";
import assert from "node:assert/strict";
import { createPredictionDraft, isValidCorrectionReason, preparePredictionBatch } from "../src/domain/prediction-batch.ts";

const participants = [{ id: "a", nome: "AMIGO A" }, { id: "b", nome: "AMIGO B" }];
const stored = { id: "p1", usuario: "AMIGO A", jogoId: "34", golsCasa: 2, golsFora: 1 };

test("novos participantes começam vazios e não geram palpites 0×0", () => {
  const draft = createPredictionDraft(participants, []);
  assert.equal(draft.length, 2);
  assert.equal(draft[0].golsCasa, "");
  assert.equal(draft[0].golsFora, "");
  assert.deepEqual(preparePredictionBatch(draft, "34"), { changes: [], errors: {} });
  draft[0].golsCasa = "0";
  draft[0].golsFora = "0";
  assert.deepEqual(preparePredictionBatch(draft, "34").changes[0], {
    usuario: "AMIGO A", jogoId: "34", golsCasa: 0, golsFora: 0, original: undefined,
  });
});

test("carrega salvos e envia somente inclusões e alterações", () => {
  const draft = createPredictionDraft(participants, [stored]);
  assert.equal(preparePredictionBatch(draft, "34").changes.length, 0);
  draft[0].golsCasa = "3";
  draft[1].golsCasa = "0";
  draft[1].golsFora = "0";
  const batch = preparePredictionBatch(draft, "34");
  assert.equal(batch.changes.length, 2);
  assert.deepEqual(batch.errors, {});
  assert.equal(batch.changes[0].original.golsCasa, 2, "conferência mantém o placar anterior");
  assert.equal(batch.changes[0].golsCasa, 3);
  assert.equal(batch.changes[1].original, undefined);
  assert.equal(stored.golsCasa, 2, "edição não modifica o original");
});

test("linha parcial, placar apagado e valores inválidos bloqueiam a conferência", () => {
  const draft = createPredictionDraft(participants, [stored]);
  draft[0].golsCasa = "";
  draft[0].golsFora = "";
  draft[1].golsCasa = "0";
  let batch = preparePredictionBatch(draft, "34");
  assert.match(batch.errors.a, /exclusão/);
  assert.match(batch.errors.b, /dois placares/);
  for (const invalid of ["-1", "1.5", "1,5", "1e1", "100", "NaN", "abc"]) {
    draft[1].golsCasa = invalid;
    draft[1].golsFora = "0";
    batch = preparePredictionBatch(draft, "34");
    assert.match(batch.errors.b, /inteiros de 0 a 99/);
    assert.equal(batch.changes.length, 0);
  }
});

test("espaços e zeros à esquerda não geram alteração falsa", () => {
  const draft = createPredictionDraft(participants, [stored]);
  draft[0].golsCasa = " 02 ";
  draft[0].golsFora = "01";
  assert.deepEqual(preparePredictionBatch(draft, "34"), { changes: [], errors: {} });
});

test("trocar jogo e descartar reconstrói o rascunho a partir dos dados corretos", () => {
  const current = createPredictionDraft(participants, [stored]);
  current[0].golsCasa = "9";
  const restored = createPredictionDraft(participants, [stored]);
  const nextGame = createPredictionDraft(participants, []);
  assert.equal(restored[0].golsCasa, "2");
  assert.equal(nextGame[0].golsCasa, "");
  assert.equal(preparePredictionBatch(nextGame, "35").changes.length, 0);
});

test("correção exige justificativa de 8 a 500 caracteres após trim", () => {
  for (const invalid of ["", "       ", "1234567", "       a", "x".repeat(501)]) {
    assert.equal(isValidCorrectionReason(invalid), false);
  }
  assert.equal(isValidCorrectionReason("  Correção conferida  "), true);
  assert.equal(isValidCorrectionReason("x".repeat(500)), true);
});
