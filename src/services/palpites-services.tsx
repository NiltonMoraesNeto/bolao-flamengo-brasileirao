import api from './api';

export const fetchPalpites = async () => {
  try {
    const response = await api.get('/palpites');

    if (response.data) {
      return response.data;
    }
    return false;
  } catch (error) {
    console.error('Erro', error);
    return false;
  }
};

export const fetchPalpitesById = async (jogoId: number) => {
  try {
    const response = await api.get(`/palpites?jogoId=${jogoId}`);

    if (response.data) {
      return response.data;
    }
    return false;
  } catch (error) {
    console.error('Erro', error);
    return false;
  }
};

export const postPalpite = async (
  usuario: string,
  jogoId: number,
  palpite: { golsCasa: number; golsFora: number }
) => {
  try {
    const response = await api.get(
      `/palpites?usuario=${usuario}&jogoId=${jogoId}`
    );
    if (response.data.length > 0) {
      // Palpite já existe, fazer PUT para atualizar
      const existingPalpite = response.data[0];
      const updateResponse = await api.put(`/palpites/${existingPalpite.id}`, {
        ...existingPalpite,
        golsCasa: palpite.golsCasa,
        golsFora: palpite.golsFora,
      });
      return updateResponse.data;
    } else {
      // Palpite não existe, fazer POST para criar
      const createResponse = await api.post('/palpites', {
        usuario,
        jogoId,
        ...palpite,
      });
      return createResponse.data;
    }
  } catch (error) {
    console.error('Erro ao salvar palpite', error);
    return false;
  }
};

export const deletePalpite = async (palpiteId: string) => {
  try {
    const response = await api.delete(`/palpites/${palpiteId}`);
    return response.status === 200;
  } catch (error) {
    console.error('Erro ao deletar palpite', error);
    return false;
  }
};
