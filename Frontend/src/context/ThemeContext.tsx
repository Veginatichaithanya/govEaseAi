import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'goveaseai_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch (err) {
    console.warn('Unable to read theme from storage:', err);
  }
  // Default to existing dark theme
  return 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Synchronize DOM attributes and meta tags whenever theme changes
  useEffect(() => {
    const root = document.documentElement;

    // Add temporary transition class for smooth theme switching animation
    root.classList.add('theme-transition');
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    // Update meta theme-color tag if present
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#F1F5F9' : '#07111F');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      console.warn('Unable to save theme to storage:', err);
    }

    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 250);

    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
