import api from './api';

export const fetchJogos = async () => {
  try {
    const response = await api.get('/jogos');

    if (response.data) {
      return response.data;
    }
    return false;
  } catch (error) {
    console.error('Erro', error);
    return false;
  }
};

export const fetchJogosById = async (id: string) => {
  try {
    const response = await api.get(`/jogos?id=${id}`);

    if (response.data) {
      return response.data;
    }
    return false;
  } catch (error) {
    console.error('Erro', error);
    return false;
  }
};
