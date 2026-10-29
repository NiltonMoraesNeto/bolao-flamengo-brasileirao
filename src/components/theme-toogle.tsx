import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/theme-context";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
  return <Button type="button" variant="ghost" size="icon" onClick={toggleTheme} aria-label={label} title={label}>
    {theme === "dark" ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}
  </Button>;
}
