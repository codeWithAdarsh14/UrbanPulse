import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

/**
 * ThemeProvider — global light/dark theme system for UrbanPulse Rose Crimson.
 * - Reads saved preference from localStorage.
 * - Falls back to system preference (prefers-color-scheme).
 * - Applies data-theme="light" | "dark" on <html>.
 * - Provides { theme, toggleTheme } to all consumers.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('up_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    // Respect system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Apply theme class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Also update color-scheme for browser UI (scrollbars, inputs)
    root.style.colorScheme = theme;
    try {
      localStorage.setItem('up_theme', theme);
    } catch {}
  }, [theme]);

  // Listen to system preference changes (only if no saved preference)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handleChange = (e) => {
      const saved = localStorage.getItem('up_theme');
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Provide safe fallback when used outside provider (shouldn't happen)
    return { theme: 'dark', toggleTheme: () => {} };
  }
  return context;
}
