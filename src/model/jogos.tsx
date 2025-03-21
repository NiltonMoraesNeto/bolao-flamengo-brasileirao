export interface Jogo {
  id: number;
  rodada: number;
  data: string;
  timeCasa: string;
  timeFora: string;
  resultado?: string;
}

export interface listaJogos {
  id: number;
  rodada: number;
  data: string;
  timeCasa: string;
  timeFora: string;
  resultado?: string;
}

// export const listaJogos: Jogo[] = [
//   {
//     id: 1,
//     rodada: 1,
//     data: '2025-03-29 20:00',
//     timeCasa: 'Flamengo',
//     timeFora: 'Internacional',
//     resultado: 'V',
//   },
//   {
//     id: 2,
//     rodada: 2,
//     data: '2025-04-05 16:00',
//     timeCasa: 'Vitória',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 3,
//     rodada: 3,
//     data: '2025-04-12 18:30',
//     timeCasa: 'Grêmio',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 4,
//     rodada: 4,
//     data: '2025-04-16 21:00',
//     timeCasa: 'Flamengo',
//     timeFora: 'Juventude',
//   },
//   {
//     id: 5,
//     rodada: 5,
//     data: '2025-04-19 19:00',
//     timeCasa: 'Vasco da Gama',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 6,
//     rodada: 6,
//     data: '2025-04-26 17:00',
//     timeCasa: 'Flamengo',
//     timeFora: 'Corinthians',
//   },
//   {
//     id: 7,
//     rodada: 7,
//     data: '2025-05-03 16:30',
//     timeCasa: 'Cruzeiro',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 8,
//     rodada: 8,
//     data: '2025-05-10 20:00',
//     timeCasa: 'Flamengo',
//     timeFora: 'Bahia',
//   },
//   {
//     id: 9,
//     rodada: 9,
//     data: '2025-05-17 18:00',
//     timeCasa: 'Flamengo',
//     timeFora: 'Botafogo',
//   },
//   {
//     id: 10,
//     rodada: 10,
//     data: '2025-05-24 21:00',
//     timeCasa: 'Palmeiras',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 11,
//     rodada: 11,
//     data: '2025-05-30 19:30',
//     timeCasa: 'Flamengo',
//     timeFora: 'Fortaleza',
//   },
//   {
//     id: 12,
//     rodada: 12,
//     data: '2025-06-11 20:00',
//     timeCasa: 'Sport',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 13,
//     rodada: 13,
//     data: '2025-07-12 18:00',
//     timeCasa: 'Flamengo',
//     timeFora: 'São Paulo',
//   },
//   {
//     id: 14,
//     rodada: 14,
//     data: '2025-07-16 21:30',
//     timeCasa: 'Santos',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 15,
//     rodada: 15,
//     data: '2025-07-19 17:00',
//     timeCasa: 'Flamengo',
//     timeFora: 'Fluminense',
//   },
//   {
//     id: 16,
//     rodada: 16,
//     data: '2025-07-23 20:00',
//     timeCasa: 'Red Bull Bragantino',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 17,
//     rodada: 17,
//     data: '2025-07-26 19:00',
//     timeCasa: 'Flamengo',
//     timeFora: 'Atlético-MG',
//   },
//   {
//     id: 18,
//     rodada: 18,
//     data: '2025-08-02 18:30',
//     timeCasa: 'Ceará',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 19,
//     rodada: 19,
//     data: '2025-08-09 21:00',
//     timeCasa: 'Flamengo',
//     timeFora: 'Mirassol',
//   },
//   {
//     id: 20,
//     rodada: 20,
//     data: '2025-08-16',
//     timeCasa: 'Internacional',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 21,
//     rodada: 21,
//     data: '2025-08-23',
//     timeCasa: 'Flamengo',
//     timeFora: 'Vitória',
//   },
//   {
//     id: 22,
//     rodada: 22,
//     data: '2025-08-30',
//     timeCasa: 'Flamengo',
//     timeFora: 'Grêmio',
//   },
//   {
//     id: 23,
//     rodada: 23,
//     data: '2025-09-13',
//     timeCasa: 'Juventude',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 24,
//     rodada: 24,
//     data: '2025-09-20',
//     timeCasa: 'Flamengo',
//     timeFora: 'Vasco',
//   },
//   {
//     id: 25,
//     rodada: 25,
//     data: '2025-09-27',
//     timeCasa: 'Corinthians',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 26,
//     rodada: 26,
//     data: '2025-10-01',
//     timeCasa: 'Flamengo',
//     timeFora: 'Cruzeiro',
//   },
//   {
//     id: 27,
//     rodada: 27,
//     data: '2025-10-16',
//     timeCasa: 'Bahia',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 28,
//     rodada: 28,
//     data: '2025-10-25',
//     timeCasa: 'Botafogo',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 29,
//     rodada: 29,
//     data: '2025-11-05',
//     timeCasa: 'Flamengo',
//     timeFora: 'Palmeiras',
//   },
//   {
//     id: 30,
//     rodada: 30,
//     data: '2025-11-19',
//     timeCasa: 'Fortaleza',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 31,
//     rodada: 31,
//     data: '2025-11-22',
//     timeCasa: 'Flamengo',
//     timeFora: 'Sport',
//   },
//   {
//     id: 32,
//     rodada: 32,
//     data: '2025-11-29',
//     timeCasa: 'São Paulo',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 33,
//     rodada: 33,
//     data: '2025-12-03',
//     timeCasa: 'Flamengo',
//     timeFora: 'Santos',
//   },
//   {
//     id: 34,
//     rodada: 34,
//     data: '2025-12-06',
//     timeCasa: 'Fluminense',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 35,
//     rodada: 35,
//     data: '2025-12-10',
//     timeCasa: 'Flamengo',
//     timeFora: 'Bragantino',
//   },
//   {
//     id: 36,
//     rodada: 36,
//     data: '2025-12-13',
//     timeCasa: 'Atlético-MG',
//     timeFora: 'Flamengo',
//   },
//   {
//     id: 37,
//     rodada: 37,
//     data: '2025-12-17',
//     timeCasa: 'Flamengo',
//     timeFora: 'Ceará',
//   },
//   {
//     id: 38,
//     rodada: 38,
//     data: '2025-12-21',
//     timeCasa: 'Mirassol',
//     timeFora: 'Flamengo',
//   },
// ];
