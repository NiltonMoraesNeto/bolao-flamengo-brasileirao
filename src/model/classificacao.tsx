export interface Jogo {
  id: number;
  rodada: number;
  data: string;
  timeCasa: string;
  timeFora: string;
  golsCasa?: number;
  golsFora?: number;
}

export interface Palpite {
  golsCasa: number;
  golsFora: number;
}

export interface Resultado {
  id: number;
  golsCasa: number;
  golsFora: number;
}
