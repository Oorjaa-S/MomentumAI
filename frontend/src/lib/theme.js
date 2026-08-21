"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  {
    id: "ocean",
    name: "Ocean",
    palette: ["#1B4050", "#30B0A5", "#248A82", "#48CCBD", "#FFFFFF"],
    previewBg: "#0e222b",
    primary: "#30B0A5",
  },
  {
    id: "forest",
    name: "Forest",
    palette: ["#1B676B", "#519548", "#88C425", "#BEF202", "#EAFDE6"],
    previewBg: "#0d2325",
    primary: "#519548",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    palette: ["#0D0D0D", "#1A1A2E", "#16213E", "#0F3460", "#E94560"],
    previewBg: "#0D0D0D",
    primary: "#E94560",
  },
  {
    id: "pastel",
    name: "Pastel",
    palette: ["#FFC8DD", "#FFAFCC", "#BDE0FE", "#A2D2FF"],
    previewBg: "#f5edf3",
    primary: "#FFAFCC",
  },
  {
    id: "sunset",
    name: "Sunset",
    palette: ["#D65DB1", "#FF6F91", "#FF9671", "#FFC75F", "#F9F871"],
    previewBg: "#FFC75F",
    primary: "#FF6F91",
  },
];

const ThemeContext = createContext({
  theme: "ocean",
  setTheme: () => { },
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("ocean");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme && THEMES.some((t) => t.id === savedTheme)) {
        setThemeState(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        document.documentElement.setAttribute("data-theme", "ocean");
      }
    } catch (e) {
      console.warn("Could not access localStorage for theme:", e);
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme) => {
    if (!THEMES.some((t) => t.id === newTheme)) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    } catch (e) {
      console.warn("Could not save theme to localStorage:", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
