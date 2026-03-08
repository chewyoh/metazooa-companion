import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "idf-theme";

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === "dark";
    return true; // default dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="mt-8 mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors text-sm"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? "מצב בהיר" : "מצב כהה"}
    </button>
  );
};
