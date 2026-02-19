import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Helper to get IST-based theme
  const getISTTheme = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hours = istTime.getHours();
    return (hours >= 6 && hours < 18) ? "light" : "dark";
  };

  // Initialize State
  const [isManual, setIsManual] = useState(() => {
    return localStorage.getItem("theme_override") === "true";
  });

  const [theme, setTheme] = useState(() => {
    // 1. Check LocalStorage (User Preference)
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;

    // 2. Check System Preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";

    // 3. Fallback to Time-based
    return getISTTheme();
  });

  // Apply Theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Live Time Check (Only if NO manual override)
  useEffect(() => {
    if (isManual || localStorage.getItem("theme_override") === "true") return;

    const checkTime = () => {
      const neededTheme = getISTTheme();
      setTheme(prev => {
        if (prev !== neededTheme) return neededTheme;
        return prev;
      });
    };

    checkTime(); // Check immediately
    const interval = setInterval(checkTime, 60000); // Check every min
    return () => clearInterval(interval);
  }, [isManual]);

  const toggleTheme = () => {
    setIsManual(true);
    localStorage.setItem("theme_override", "true");
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
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
