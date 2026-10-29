import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/auth-context";
import { ThemeToggle } from "./theme-toogle";

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-card px-3 sm:px-6">
      <Link to="/home" className="flex min-h-11 min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <img src="/flamengo_logo.png" width={30} height={36} alt="" className="h-9 w-8 shrink-0 object-contain" />
        <span className="truncate text-sm font-bold sm:text-base">Bolão do Flamengo</span>
      </Link>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Sair da conta" title="Sair da conta" onClick={() => { logout(); navigate("/login", { replace: true }); }}><LogOut aria-hidden="true" className="h-5 w-5" /></Button>
      </div>
    </header>
  );
}
