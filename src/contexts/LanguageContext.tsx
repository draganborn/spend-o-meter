import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Language } from '../types';
import { translations } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  t: typeof translations.ru;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('appLang') as Language) || 'ru';
  });

  const toggleLanguage = () => {
    const newLang: Language = language === 'ru' ? 'en' : 'ru';
    setLanguage(newLang);
    localStorage.setItem('appLang', newLang);
  };

  useEffect(() => {
    localStorage.setItem('appLang', language);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        t: translations[language],
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
