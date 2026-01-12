import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { LANGUAGES, DEFAULT_LANG, getText } from '../constants/languages';
import { safeStorage } from '../hooks/useSafeLocalStorage';

const STORAGE_KEYS = {
  LANG: 'appLang',
  THEME: 'appTheme',
};

const ThemeContext = createContext();
const LanguageContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    safeStorage.getItem(STORAGE_KEYS.THEME, 'light') === 'dark' ? 'dark' : 'light',
  );

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      safeStorage.setItem(STORAGE_KEYS.THEME, next);
      return next;
    });
  };

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    safeStorage.getItem(STORAGE_KEYS.LANG, DEFAULT_LANG) || DEFAULT_LANG,
  );

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'ru' ? 'en' : 'ru';
      safeStorage.setItem(STORAGE_KEYS.LANG, next);
      return next;
    });
  };

  const contextValue = useMemo(
    () => ({
      language,
      toggleLanguage,
      translations: LANGUAGES[language] || LANGUAGES[DEFAULT_LANG],
      t: path => getText(path, language),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useTheme = () => useContext(ThemeContext);
export const useLanguage = () => useContext(LanguageContext);
