import api from './api';

export const fetchResultados = async () => {
  try {
    const response = await api.get('/resultados');

    if (response.data) {
      return response.data;
    }
    return false;
  } catch (error) {
    console.error('Erro', error);
    return false;
  }
};

export const fetchResultadosByID = async (id: number) => {
  try {
    const response = await api.get(`/resultados?id=${id}`);

    if (response.data) {
      return response.data;
    }
    return false;
  } catch (error) {
    console.error('Erro', error);
    return false;
  }
};
