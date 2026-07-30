"use client";

import { useEffect } from "react";

const THEME_STORAGE_KEY = "inventory-theme";

type ThemeMode = "light" | "dark";

function getThemeFromStorage(): ThemeMode | null {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeModeScript() {
  useEffect(() => {
    const theme = getThemeFromStorage() ?? getPreferredTheme();
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.style.colorScheme = theme;
  }, []);

  return null;
}
