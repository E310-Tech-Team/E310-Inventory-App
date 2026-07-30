"use client";

import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";

const THEME_STORAGE_KEY = "inventory-theme";

type ThemeMode = "light" | "dark";

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: ThemeMode = storedTheme
      ? storedTheme
      : preferredDark
      ? "dark"
      : "light";

    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="pressable w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
    >
      {theme === "dark" ? (
        <SunMedium className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
