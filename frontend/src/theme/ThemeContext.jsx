import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { applyInstitutionPalette, DEFAULT_INSTITUTION_PALETTE, createInstitutionPalette, extractThemeFromLogoUrl } from './institutionTheme';

export const THEMES = [
  { id: 'institution', name: 'Institution', color: '#2f855a', soft: '#edf8f1' },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { data: profile } = useProfile();
  const [palette, setPalette] = useState(DEFAULT_INSTITUTION_PALETTE);

  const institution = profile?.institution;
  const logoUrl = institution?.logoUrl;
  const savedColours = institution?.colours;
  const institutionId = institution?.id;

  useEffect(() => {
    let cancelled = false;
    // The saved colours are an immediate preview, NOT proof that the current
    // logo has been analysed. Older schools can have a stale green palette.
    const initial = savedColours?.primary
      ? createInstitutionPalette(savedColours.primary)
      : DEFAULT_INSTITUTION_PALETTE;
    setPalette(initial);
    applyInstitutionPalette(initial);

    if (!logoUrl) return () => { cancelled = true; };

    // Always analyse the current logo, even if colours already exist.
    // Avoid applying an outdated result after changing accounts/institutions.
    extractThemeFromLogoUrl(logoUrl).then((detected) => {
      if (cancelled || !detected?.primary) return;
      setPalette(detected);
      applyInstitutionPalette(detected);
    });

    return () => { cancelled = true; };
  }, [institutionId, logoUrl, savedColours?.primary]);

  const value = useMemo(() => ({
    theme: 'institution',
    currentTheme: { ...THEMES[0], color: palette.primary, soft: palette.soft },
    palette,
  }), [palette]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
