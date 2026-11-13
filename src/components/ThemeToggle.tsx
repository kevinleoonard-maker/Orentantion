import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme';

// Pulsante tondo sole/luna: mostra il tema in cui si passa premendolo.
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggle } = useTheme();
  const toDark = theme === 'light';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={toDark ? 'Passa al tema scuro' : 'Passa al tema chiaro'}
      title={toDark ? 'Tema scuro' : 'Tema chiaro'}
      className={`w-10 h-10 shrink-0 rounded-full border border-line-btn flex items-center justify-center hover:border-ink transition-colors ${className}`}
    >
      {toDark ? <Moon className="w-4 h-4" aria-hidden="true" /> : <Sun className="w-4 h-4" aria-hidden="true" />}
    </button>
  );
};
