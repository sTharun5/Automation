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
    return sessionStorage.getItem("theme_override") === "true";
  });

  const [theme, setTheme] = useState(() => {
    if (sessionStorage.getItem("theme_override") === "true") {
      return localStorage.getItem("theme") || "light";
    }
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

  // Live Time Check (Every 1 Minute)
  useEffect(() => {
    if (isManual) return; // Don't auto-switch if user manually toggled

    const checkTime = () => {
      const neededTheme = getISTTheme();
      setTheme(prev => {
        if (prev !== neededTheme) return neededTheme;
        return prev;
      });
    };

    checkTime(); // Check immediately on mount in case logic missed
    const interval = setInterval(checkTime, 60000); // Check every min
    return () => clearInterval(interval);
  }, [isManual]);

  const toggleTheme = () => {
    setIsManual(true);
    sessionStorage.setItem("theme_override", "true");
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
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
