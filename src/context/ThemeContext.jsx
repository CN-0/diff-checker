import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
const THEME_KEY = 'openutils-theme';

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem(THEME_KEY) ?? 'false'); }
    catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem(THEME_KEY, JSON.stringify(darkMode)); } catch {}
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
