import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const THEMES = [
  { id: 'collegebook', name: 'CollegeBook', color: '#0b7285', soft: '#dff4f5' },
  { id: 'ocean', name: 'Ocean Blue', color: '#2563eb', soft: '#dbeafe' },
  { id: 'royal', name: 'Royal Indigo', color: '#4f46e5', soft: '#e0e7ff' },
  { id: 'violet', name: 'Violet', color: '#7c3aed', soft: '#ede9fe' },
  { id: 'rose', name: 'Rose', color: '#e11d48', soft: '#ffe4e6' },
  { id: 'emerald', name: 'Emerald', color: '#059669', soft: '#d1fae5' },
  { id: 'green', name: 'Forest Green', color: '#15803d', soft: '#dcfce7' },
  { id: 'amber', name: 'Amber', color: '#c47f12', soft: '#fef3c7' },
  { id: 'coral', name: 'Coral', color: '#ea580c', soft: '#ffedd5' },
  { id: 'slate', name: 'Slate', color: '#475569', soft: '#e2e8f0' },
];

const STORAGE_KEY = 'collegebook-theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return THEMES.some((item) => item.id === saved) ? saved : 'collegebook';
    } catch {
      return 'collegebook';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const setTheme = (nextTheme) => {
    if (THEMES.some((item) => item.id === nextTheme)) setThemeState(nextTheme);
  };

  const value = useMemo(() => ({
    theme,
    setTheme,
    themes: THEMES,
    currentTheme: THEMES.find((item) => item.id === theme) || THEMES[0],
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
