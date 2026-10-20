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

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    setMounted(true);
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        disabled
        className={
          compact
            ? "p-2 rounded-lg border border-border bg-surface text-muted transition-colors opacity-70"
            : "w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors opacity-70"
        }
      >
        <div className="w-4 h-4" />
        {!compact && <span>Theme</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={
        compact
          ? "pressable p-2 rounded-lg border border-border bg-surface text-foreground hover:bg-background transition-colors"
          : "pressable w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
      }
    >
      {theme === "dark" ? (
        <SunMedium className="w-4 h-4 text-brand-yellow" />
      ) : (
        <Moon className="w-4 h-4 text-foreground" />
      )}
      {!compact && (theme === "dark" ? "Light mode" : "Dark mode")}
    </button>
  );
}
