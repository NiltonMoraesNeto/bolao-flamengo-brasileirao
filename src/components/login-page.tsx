import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { fetchLogin } from "../services/login";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await fetchLogin(email, password);

    if (result) {
      const { token } = result;
      login(token);
      navigate("/home");
    } else {
      setError("Email ou senha inválidos");
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Coluna esquerda - Roxo  */}
      <div className="hidden w-1/2 flex-col justify-between bg-black p-12 text-red-500 md:flex h-full">
        <div>
          <div className="flex items-center gap-2 text-xl font-semibold">
            Bolão do Flamengo - Brasileirão 2025
          </div>
        </div>
        <div className="space-y-6">
          <img
            className="w-96 h-96 flex justify-center items-center"
            src="/flamengo_logo.png"
          />
        </div>
        <div></div>
      </div>

      {/* Coluna direita - Branco */}
      <div className="flex w-full flex-col items-center justify-center bg-red-600 p-6 md:w-1/2 md:p-12 h-full">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-black">LOGIN</h2>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-black rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="border-black focus-visible:ring-black text-black placeholder:text-black"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="border-black focus-visible:ring-black text-white placeholder:text-black"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-600"
            >
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
