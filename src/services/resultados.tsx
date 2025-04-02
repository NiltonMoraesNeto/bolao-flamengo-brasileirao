import api from "./api";

interface Resultado {
  id: string;
  golsCasa: number;
  golsFora: number;
}

interface DadosJogo {
  golsCasa: number;
  golsFora: number;
  selectedTimeCasa: string;
  selectedTimeFora: string;
}

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

export const inserirResultado = async (resultado: Resultado) => {
  try {
    const response = await api.post("/resultados/new", resultado);
    return response.data;
  } catch (error) {
    console.error("Erro ao inserir resultado:", error);
    throw error;
  }
};

export const atualizarJogo = async (id: string, dados: DadosJogo) => {
  try {
    const response = await api.put(`/jogosEdit/${id}`, dados);
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar jogo:", error);
    throw error;
  }
};
