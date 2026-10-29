import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateScore, SCORING_VERSION } from "../src/domain/scoring.ts";

const score = ([golsCasa, golsFora]) => ({ golsCasa, golsFora });

const scenarios = [
  ["placar exato", [2, 1], [2, 1], "Flamengo", 25, true],
  ["empate exato sem gols", [0, 0], [0, 0], "Flamengo", 25, true],
  ["vencedor e gols da casa", [2, 1], [2, 0], "Flamengo", 20, false],
  ["vencedor e gols de fora", [3, 1], [2, 1], "Flamengo", 20, false],
  ["vencedor sem acertar gols", [3, 1], [2, 0], "Flamengo", 15, false],
  ["empate não exato vale 15 conforme regulamento confirmado", [1, 1], [0, 0], "Flamengo", 15, false],
  ["empate com gols de um time", [1, 1], [1, 0], "Flamengo", 5, false],
  ["derrota do Flamengo em casa e um gol certo", [0, 2], [0, 0], "Flamengo", 5, false],
  ["derrota do Flamengo fora e um gol certo", [2, 0], [0, 0], "Vasco", 5, false],
  ["vitória do Flamengo e resultado errado", [2, 0], [2, 3], "Flamengo", 0, false],
  ["vitória do Flamengo fora e resultado errado", [0, 2], [3, 2], "Vasco", 0, false],
  ["derrota prevista corretamente", [0, 2], [0, 1], "Flamengo", 20, false],
  ["erro completo", [2, 0], [0, 1], "Flamengo", 0, false],
];

test("versão identifica o regulamento confirmado", () => {
  assert.equal(SCORING_VERSION, "legacy-v1");
});

for (const [name, result, prediction, homeTeam, pontos, acertoExato] of scenarios) {
  test(name, () => {
    assert.deepEqual(calculateScore(score(result), score(prediction), homeTeam), {
      pontos,
      acertoExato,
    });
  });
}

test("inverter mando e os placares mantém a pontuação", () => {
  for (let home = 0; home <= 4; home++) {
    for (let away = 0; away <= 4; away++) {
      for (let guessHome = 0; guessHome <= 4; guessHome++) {
        for (let guessAway = 0; guessAway <= 4; guessAway++) {
          assert.deepEqual(
            calculateScore(score([home, away]), score([guessHome, guessAway]), "Flamengo"),
            calculateScore(score([away, home]), score([guessAway, guessHome]), "Vasco"),
          );
        }
      }
    }
  }
});

test("cálculo é determinístico e não modifica os placares", () => {
  const result = Object.freeze(score([2, 1]));
  const prediction = Object.freeze(score([1, 0]));
  assert.deepEqual(
    calculateScore(result, prediction, "Flamengo"),
    calculateScore(result, prediction, "Flamengo"),
  );
  assert.deepEqual(result, score([2, 1]));
  assert.deepEqual(prediction, score([1, 0]));
});
