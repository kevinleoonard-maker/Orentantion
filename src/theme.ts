import { useCallback, useEffect, useState } from 'react';

// Tema chiaro/scuro. Il tema sta in data-theme su <html> (i colori sono in index.css). Lo imposta per primo lo
// script in <head> di index.html e speaker.html, prima del primo disegno, così non c'è il lampo di pagina bianca.
// Regola: se il visitatore ha scelto (pulsante sole/luna) vale la sua scelta, salvata nel browser; altrimenti
// si segue il tema del sistema, anche quando cambia.

export type Theme = 'light' | 'dark';

const KEY = 'ks01-theme';
const BROWSER_COLOR: Record<Theme, string> = { light: '#ffffff', dark: '#0d0d0f' };

const current = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

// localStorage può essere bloccato (navigazione privata, dati del sito disattivati): in quel caso si ignora.
function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BROWSER_COLOR[theme]);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  useEffect(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (stored()) return; // ha già scelto lui
      const next: Theme = system.matches ? 'dark' : 'light';
      apply(next);
      setTheme(next);
    };
    system.addEventListener('change', onChange);
    return () => system.removeEventListener('change', onChange);
  }, []);

  const choose = useCallback((next: Theme) => {
    apply(next);
    setTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* la scelta vale per questa visita */
    }
  }, []);

  const toggle = useCallback(() => choose(current() === 'dark' ? 'light' : 'dark'), [choose]);

  return { theme, toggle };
}
