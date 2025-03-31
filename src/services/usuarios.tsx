import api from "./api";

export const fetchUsuarios = async () => {
  try {
    const response = await api.get("/usuarios/list");

    if (response.data) {
      return response.data;
    }
    return false;
  } catch (error) {
    console.error("Erro", error);
    return false;
  }
};
