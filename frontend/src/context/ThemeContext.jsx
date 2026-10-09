import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'collegebook-theme';

export const THEMES = [
  { id: 'default', name: 'CollegeBook', description: 'The original CollegeBook look', swatch: '#0b7285', colors: { brand: '#0b7285', brandHover: '#085c6b', brandSoft: '#dff4f5', bg: '#f6f8f9', surface: '#ffffff', border: '#dce5e7', text: '#172326', textSecondary: '#647579', authBg: '#eefafd', waveRgb: '24,151,174' } },
  { id: 'ocean', name: 'Ocean', description: 'Calm blue and coastal tones', swatch: '#1976a8', colors: { brand: '#1976a8', brandHover: '#145d84', brandSoft: '#e0f2fa', bg: '#f5f9fc', surface: '#ffffff', border: '#d8e5ec', text: '#152a35', textSecondary: '#607783', authBg: '#eef8fd', waveRgb: '25,118,168' } },
  { id: 'royal', name: 'Royal', description: 'Confident indigo and blue', swatch: '#4f46a5', colors: { brand: '#4f46a5', brandHover: '#3f3786', brandSoft: '#e9e8fb', bg: '#f7f7fc', surface: '#ffffff', border: '#dedff0', text: '#202035', textSecondary: '#696982', authBg: '#f2f1fc', waveRgb: '79,70,165' } },
  { id: 'purple', name: 'Purple', description: 'Modern violet accents', swatch: '#7c3aed', colors: { brand: '#7c3aed', brandHover: '#6525c7', brandSoft: '#f0e8ff', bg: '#faf8fe', surface: '#ffffff', border: '#e5dcf3', text: '#251c32', textSecondary: '#756a80', authBg: '#f7f1ff', waveRgb: '124,58,237' } },
  { id: 'emerald', name: 'Emerald', description: 'Fresh green and natural tones', swatch: '#16835a', colors: { brand: '#16835a', brandHover: '#106745', brandSoft: '#e1f5ed', bg: '#f5faf8', surface: '#ffffff', border: '#d8e8e1', text: '#182c25', textSecondary: '#63776f', authBg: '#eff9f4', waveRgb: '22,131,90' } },
  { id: 'rose', name: 'Rose', description: 'Elegant rose and berry tones', swatch: '#c43f68', colors: { brand: '#c43f68', brandHover: '#a63256', brandSoft: '#fbe7ee', bg: '#fcf7f9', surface: '#ffffff', border: '#ecdde3', text: '#311d25', textSecondary: '#7b6870', authBg: '#fdf1f5', waveRgb: '196,63,104' } },
  { id: 'amber', name: 'Amber', description: 'Warm gold with a polished feel', swatch: '#b7791f', colors: { brand: '#b7791f', brandHover: '#925f18', brandSoft: '#fff3d8', bg: '#fcfaf5', surface: '#ffffff', border: '#ebe1cc', text: '#302719', textSecondary: '#776b58', authBg: '#fcf7e9', waveRgb: '183,121,31' } },
  { id: 'slate', name: 'Slate', description: 'Quiet blue-gray professional tones', swatch: '#475569', colors: { brand: '#475569', brandHover: '#334155', brandSoft: '#e9edf2', bg: '#f5f7f9', surface: '#ffffff', border: '#dce2e8', text: '#1f2933', textSecondary: '#64717f', authBg: '#f1f4f7', waveRgb: '71,85,105' } },
  { id: 'sky', name: 'Sky', description: 'Bright and airy blue', swatch: '#1688c4', colors: { brand: '#1688c4', brandHover: '#116b9b', brandSoft: '#e0f3fc', bg: '#f5faff', surface: '#ffffff', border: '#d9eaf4', text: '#172b38', textSecondary: '#627785', authBg: '#eff8fd', waveRgb: '22,136,196' } },
  { id: 'forest', name: 'Forest', description: 'Deep green with an academic feel', swatch: '#176b4d', colors: { brand: '#176b4d', brandHover: '#12543c', brandSoft: '#e2f1eb', bg: '#f5faf7', surface: '#ffffff', border: '#d9e7e0', text: '#182b24', textSecondary: '#62766d', authBg: '#eff8f4', waveRgb: '23,107,77' } },
];

const DEFAULT_THEME = THEMES[0];
const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.some((theme) => theme.id === value) ? value : DEFAULT_THEME.id;
  } catch {
    return DEFAULT_THEME.id;
  }
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(readStoredTheme);
  const theme = useMemo(() => THEMES.find((item) => item.id === themeId) || DEFAULT_THEME, [themeId]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssName = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      root.style.setProperty(`--theme-${cssName}`, value);
    });
    try {
      window.localStorage.setItem(STORAGE_KEY, theme.id);
    } catch {
      // Theme still works when localStorage is unavailable.
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, themeId, themes: THEMES, setTheme: setThemeId }), [theme, themeId]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
