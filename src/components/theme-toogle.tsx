import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/theme-context";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      className="p-2 rounded focus:outline-none bg-red-500 hover:bg-red-400 text-black hover:text-gray-300"
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
