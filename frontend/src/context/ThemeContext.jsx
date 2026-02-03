import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Helper to get IST-based theme
  const getISTTheme = () => {
    // Get current time in IST
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hours = istTime.getHours();

    // Light between 6 AM and 6 PM (18:00)
    return (hours >= 6 && hours < 18) ? "light" : "dark";
  };

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    const isOverride = localStorage.getItem("theme_override") === "true";

    if (isOverride && saved) {
      return saved;
    }
    return getISTTheme();
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme_override", "true");
      localStorage.setItem("theme", next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
