export interface Jogo {
  id: number;
  rodada: number;
  data: string;
  timeCasa: string;
  timeFora: string;
  resultado?: string;
  placar?: string;
}

export interface listaJogos {
  id: number;
  rodada: number;
  data: string;
  timeCasa: string;
  timeFora: string;
  resultado?: string;
}
