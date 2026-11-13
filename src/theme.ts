import { useCallback, useState } from 'react';

// Tema chiaro/scuro. Il tema sta in data-theme su <html> (i colori sono in index.css). Lo imposta per primo lo
// script in <head> di index.html e speaker.html, prima del primo disegno, così non c'è il lampo di pagina chiara.
// Regola: il sito parte SCURO. Chi sceglie il chiaro con il pulsante sole/luna se lo ritrova salvato nel browser.

export type Theme = 'light' | 'dark';

const KEY = 'ks01-theme';
const BROWSER_COLOR: Record<Theme, string> = { light: '#ffffff', dark: '#0d0d0f' };

const current = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BROWSER_COLOR[theme]);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  const choose = useCallback((next: Theme) => {
    apply(next);
    setTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* localStorage può essere bloccato (navigazione privata): la scelta vale per questa visita */
    }
  }, []);

  const toggle = useCallback(() => choose(current() === 'dark' ? 'light' : 'dark'), [choose]);

  return { theme, toggle };
}
