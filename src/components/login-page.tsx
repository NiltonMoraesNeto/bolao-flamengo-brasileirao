import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ThemeToggle } from "./theme-toogle";
import { FieldErrors } from "./field-errors";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { loginFormSchema } from "../domain/form-schemas";
import api from "../services/api";

export function LoginPage() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const mutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof loginFormSchema>) => {
      const response = await api.post<unknown>("/usuarios/login", credentials);
      return z.object({ token: z.string() }).parse(response.data);
    },
    gcTime: 0,
  });
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: loginFormSchema, onBlur: loginFormSchema, onSubmit: loginFormSchema },
    onSubmit: async ({ value }) => {
      setError("");
      try {
        const { token } = await mutation.mutateAsync(loginFormSchema.parse(value));
        login(token);
        navigate("/home", { replace: true });
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        setError(status === 401 ? "Email ou senha inválidos." : status === 403 ? "Acesso restrito ao administrador." : status === 429 ? "Muitas tentativas. Aguarde e tente novamente." : "Não foi possível entrar. Confira sua conexão e tente novamente.");
      }
    },
  });
  const values = useStore(form.store, state => state.values);
  const busy = useStore(form.store, state => state.isSubmitting);

  return (
    <div className="relative flex min-h-dvh bg-background text-foreground">
      <div className="absolute right-3 top-3"><ThemeToggle /></div>
      <div className="hidden w-1/2 flex-col items-center justify-center gap-8 bg-black p-12 text-white md:flex">
        <img src="/flamengo_logo.png" alt="Escudo do Flamengo" className="h-56 w-56 object-contain" />
        <p className="text-2xl font-semibold">Bolão do Flamengo</p>
      </div>
      <div className="flex w-full items-center justify-center p-6 md:w-1/2">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600 dark:text-red-400">Acesso do organizador</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Entrar no bolão</h1>
          <form noValidate onSubmit={event => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }} className="mt-8 space-y-5">
            <form.Field name="email">{field => <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="username" value={field.state.value} onChange={event => field.handleChange(event.target.value)} onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0} aria-describedby="email-error" disabled={busy} placeholder="seu@email.com" />
              <FieldErrors id="email-error" errors={field.state.meta.errors} />
            </div>}</form.Field>
            <form.Field name="password">{field => <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" value={field.state.value} onChange={event => field.handleChange(event.target.value)} onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0} aria-describedby="password-error" disabled={busy} />
              <FieldErrors id="password-error" errors={field.state.meta.errors} />
            </div>}</form.Field>
            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button type="submit" variant="destructive" className="w-full" disabled={busy || !loginFormSchema.safeParse(values).success}>{busy ? "Entrando…" : "Entrar"}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
