import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Language, type TranslationKey, getTranslation } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('app-language');
    // Validate stored language
    if (stored && (stored === 'tr' || stored === 'en' || stored === 'de' || stored === 'fr' || stored === 'es')) {
      return stored as Language;
    }
    return 'tr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: TranslationKey): string => {
    try {
      return getTranslation(key, language);
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if context is not available
    console.warn('useLanguage must be used within LanguageProvider, using fallback');
    return {
      language: 'tr' as Language,
      setLanguage: () => {},
      t: (key: TranslationKey) => key
    };
  }
  return context;
};
