import api from "./api";

export const fetchLogin = async (email: string, password: string) => {
  try {
    const response = await api.post("/usuarios/login", { email, password });
    return response.data;
  } catch (error) {
    console.error("🚨 Erro no fetchLogin:", error);
    return false;
  }
};
