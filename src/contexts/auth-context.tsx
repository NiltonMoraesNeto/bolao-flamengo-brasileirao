import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { TokenPayload } from "../model/profile-model";
import { jwtDecode } from "jwt-decode";
import { AuthContextType } from "../model/auth-context-model";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeProfile(token: string): TokenPayload {
  const payload = jwtDecode<{ sub: string; email: string; exp: number;
    user_metadata?: { nome?: string; avatar_url?: string } }>(token);
  if (!payload.sub || !payload.exp || payload.exp <= Date.now() / 1000) throw new Error("Sessão expirada");
  return { id: payload.sub, email: payload.email, exp: payload.exp, perfil: "admin",
    nome: payload.user_metadata?.nome ?? payload.email, avatar: payload.user_metadata?.avatar_url ?? "" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [dataUser, setDataUser] = useState<TokenPayload | undefined>(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return undefined;
    try { return decodeProfile(token); }
    catch { localStorage.removeItem("auth_token"); return undefined; }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(dataUser));
  const [profileUser, setProfileUser] = useState<string>("");

  useEffect(() => {
    const expire = () => {
      client.clear();
      setIsAuthenticated(false);
      setDataUser(undefined);
    };
    window.addEventListener("auth:expired", expire);
    return () => window.removeEventListener("auth:expired", expire);
  }, [client]);

  const login = (token: string) => {
    const decoded = decodeProfile(token);
    client.clear();
    localStorage.setItem("auth_token", token);
    setDataUser(decoded);
    setIsAuthenticated(true);
  };

  const logout = () => {
    client.clear();
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);
    setDataUser(undefined);
    setProfileUser("");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, dataUser, profileUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
