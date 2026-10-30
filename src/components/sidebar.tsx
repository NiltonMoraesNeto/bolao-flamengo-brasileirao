import { FlaskConical, Home, Trophy, Volleyball } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";

const items = [
  { path: "/home", label: "Jogos", icon: Home },
  { path: "/palpites", label: "Palpites", icon: Volleyball },
  { path: "/simulacao", label: "Simulação", icon: FlaskConical },
  { path: "/classificacao", label: "Classificação", icon: Trophy },
];

export default function Sidebar() {
  const { dataUser } = useAuth();
  return <>
    <aside className="hidden w-56 shrink-0 border-r bg-card lg:block">
      <div className="sticky top-24 space-y-6 p-4">
        <div className="border-b pb-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Organizador</p><p className="mt-2 truncate text-sm font-medium" title={dataUser?.nome}>{dataUser?.nome}</p></div>
        <nav aria-label="Navegação principal" className="space-y-2">
          {items.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path}
            className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <Icon aria-hidden="true" className="h-5 w-5" />{label}
          </NavLink>)}
        </nav>
      </div>
    </aside>
    <nav aria-label="Navegação no celular" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card pb-[env(safe-area-inset-bottom)] shadow-sm lg:hidden">
      {items.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path}
        className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1 border-t-2 px-1 py-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:bg-muted"}`}>
        <Icon aria-hidden="true" className="h-5 w-5" />{label}
      </NavLink>)}
    </nav>
  </>;
}
