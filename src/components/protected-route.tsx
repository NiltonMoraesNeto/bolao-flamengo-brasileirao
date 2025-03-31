import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  // Se não estiver autenticado, redireciona para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado, renderiza as rotas filhas
  return <Outlet />;
}
