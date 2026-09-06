import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const themesList = [
  { id: "sapphire", name: "Dark Sapphire 🌌", icon: "💎", accent: "#0ea5e9" },
  { id: "midnight", name: "Midnight Cozy 🌙", icon: "🌙", accent: "#f59e0b" },
  { id: "lilac", name: "Lilac Lavender ⚡", icon: "⚡", accent: "#a855f7" },
  { id: "forest", name: "Sage Forest 🌿", icon: "🌿", accent: "#10b981" },
  { id: "terracotta", name: "Warm Terracotta 🍯", icon: "🍯", accent: "#c2410c" },
];

const legacyMap = {
  glassmorphic: "terracotta",
  classic: "midnight",
  cyberpunk: "lilac",
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem("guppshup-theme") || "sapphire";
    return legacyMap[stored] || stored;
  });

  const setTheme = (newTheme) => {
    const mapped = legacyMap[newTheme] || newTheme;
    setThemeState(mapped);
    localStorage.setItem("guppshup-theme", mapped);
  };

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove(
      "theme-glassmorphic",
      "theme-classic",
      "theme-cyberpunk",
      "theme-forest",
      "theme-sapphire",
      "theme-terracotta",
      "theme-midnight",
      "theme-lilac"
    );
    html.classList.add(`theme-${theme}`);
    html.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themesList }}>
      {children}
    </ThemeContext.Provider>
  );
};
