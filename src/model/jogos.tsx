export interface Jogo {
  id: string;
  rodada: number;
  data: string;
  timeCasa: string;
  timeFora: string;
  resultado?: string;
  placar?: string;
}

export interface listaJogos {
  id: string;
  rodada: number;
  data: string;
  timeCasa: string;
  timeFora: string;
  resultado?: string;
}
