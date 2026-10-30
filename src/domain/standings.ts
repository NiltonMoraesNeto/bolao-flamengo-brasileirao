import { calculateScore } from "./scoring.ts";
import type { Score } from "./scoring.ts";
import { isFutureGame } from "./game-eligibility.ts";

interface RankingGame { id: string; timeCasa: string }
export interface RankingPrediction extends Score { usuario: string; jogoId: string }
interface RankingResult extends Score { id: string }
export interface Standing { usuario: string; pontos: number; acertosExatos: number }

export function calculateStandings(
  users: readonly string[], games: readonly RankingGame[],
  predictions: readonly RankingPrediction[], results: readonly RankingResult[],
): Standing[] {
  const gamesById = new Map(games.map(game => [game.id, game]));
  const byUser = new Map<string, Map<string, RankingPrediction>>();
  for (const prediction of predictions) {
    const userPredictions = byUser.get(prediction.usuario) ?? new Map<string, RankingPrediction>();
    userPredictions.set(prediction.jogoId, prediction);
    byUser.set(prediction.usuario, userPredictions);
  }
  return users.map(usuario => {
    let pontos = 0;
    let acertosExatos = 0;
    for (const result of results) {
      const game = gamesById.get(result.id);
      const prediction = byUser.get(usuario)?.get(result.id);
      if (!game || !prediction) continue;
      const score = calculateScore(result, prediction, game.timeCasa);
      pontos += score.pontos;
      if (score.acertoExato) acertosExatos++;
    }
    return { usuario, pontos, acertosExatos };
  }).sort((a, b) => b.pontos - a.pontos || b.acertosExatos - a.acertosExatos);
}

/** Palpites e resultado hipotéticos de um jogo futuro, apenas em cópias locais. */
export function simulateStandings(
  users: readonly string[], games: readonly (RankingGame & { data: string })[],
  predictions: readonly RankingPrediction[], results: readonly RankingResult[],
  gameId: string, score: Score,
  scenario: readonly RankingPrediction[] = predictions.filter(prediction => prediction.jogoId === gameId), now = Date.now(),
): Standing[] {
  const game = games.find(game => game.id === gameId);
  if (!game || !isFutureGame(game, results, now)) throw new Error("Somente jogos futuros e sem resultado oficial podem ser simulados.");
  if (scenario.some(prediction => prediction.jogoId !== gameId)) throw new Error("O cenário contém palpites de outro jogo.");
  const hypotheticalPredictions = [...predictions.filter(prediction => prediction.jogoId !== gameId), ...scenario];
  return calculateStandings(users, games, hypotheticalPredictions, [...results, { id: gameId, ...score }]);
}
