import { AxiosError, AxiosResponse } from "axios";
import { isErroRequest } from "../utils/response-request";

export const handleError = (error: unknown): AxiosResponse | null => {
  if (error instanceof AxiosError) {
    if (isErroRequest(error.response?.status) || error.response?.data === "Not found") {
      return error.response ?? null;
    
    } else {
      throw new Error(`Erro ao buscar pedidos: ${error.message}`);
    }
  } else {
    console.error("Erro desconhecido ao buscar pedidos:", error);
    throw new Error("Erro ao buscar pedidos. Tente novamente mais tarde.");
  }
};