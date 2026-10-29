/** Regulamento confirmado pelo organizador em 29/10/2026. Mudanças exigem nova versão. */
export const SCORING_VERSION = "legacy-v1";

export interface Score {
  golsCasa: number;
  golsFora: number;
}

export interface ScoringBreakdown {
  pontos: number;
  acertoExato: boolean;
}

/** Recebe placares já validados; não depende de React, rede ou armazenamento. */
export function calculateScore(
  resultado: Score,
  palpite: Score,
  timeCasa: string,
): ScoringBreakdown {
  const acertouCasa = palpite.golsCasa === resultado.golsCasa;
  const acertouFora = palpite.golsFora === resultado.golsFora;

  if (acertouCasa && acertouFora) {
    return { pontos: 25, acertoExato: true };
  }

  const acertouResultado =
    Math.sign(palpite.golsCasa - palpite.golsFora) ===
    Math.sign(resultado.golsCasa - resultado.golsFora);

  if (acertouResultado) {
    // Pelo regulamento, empate não exato vale 15 pontos.
    return { pontos: acertouCasa || acertouFora ? 20 : 15, acertoExato: false };
  }

  const saldoFlamengo = timeCasa === "Flamengo"
    ? resultado.golsCasa - resultado.golsFora
    : resultado.golsFora - resultado.golsCasa;

  return {
    pontos: saldoFlamengo <= 0 && (acertouCasa || acertouFora) ? 5 : 0,
    acertoExato: false,
  };
}
