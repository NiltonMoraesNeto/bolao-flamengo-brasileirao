import api from "./api";

export const fetchResultados = async () => {
  try {
    const response = await api.get("/resultados/list");

    if (response.data) {
      return response.data;
    }
    return false;
  } catch (error) {
    console.error("Erro", error);
    return false;
  }
};

export const fetchResultadosByID = async (id: number) => {
  try {
    const response = await api.get(`/resultadosById?id=${id}`);

    if (response.data) {
      return response.data;
    }
    return false;
  } catch (error) {
    console.error("Erro", error);
    return false;
  }
};
