/** Aberto somente antes do início e sem resultado oficial registrado. */
export function isFutureGame(
  game: { id: string; data: string }, results: readonly { id: string }[], now = Date.now(),
) {
  return Date.parse(game.data) > now && !results.some(result => result.id === game.id);
}
