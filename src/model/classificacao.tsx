export interface Jogo {
  id: string;
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
  id: string;
  golsCasa: number;
  golsFora: number;
}
