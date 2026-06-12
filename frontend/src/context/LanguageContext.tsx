import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE } from '../config';

interface LanguageContextType {
  t: (key: string, defaultValue: string) => string;
  currentLanguage: string;
  changeLanguage: (lang: string) => Promise<void>;
  translationsEnabled: boolean;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('app_lang') || 'pt';
  });
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translationsEnabled, setTranslationsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTranslations = async (lang: string) => {
    try {
      const response = await fetch(`${API_BASE}/translations.php?lang=${lang}&t=${Date.now()}`);
      const data = await response.json();
      if (data) {
        setCurrentLanguage(data.lang);
        setTranslations(data.translations || {});
        setTranslationsEnabled(data.enabled);
        localStorage.setItem('app_lang', data.lang);
        
        // Set cookie as well for server side consistency if needed
        document.cookie = `app_lang=${data.lang}; path=/; max-age=31536000`;
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslations(currentLanguage);
  }, []);

  const changeLanguage = async (lang: string) => {
    setLoading(true);
    await fetchTranslations(lang);
  };

  const t = (key: string, defaultValue: string): string => {
    if (!translationsEnabled) {
      return defaultValue;
    }
    return translations[key] !== undefined ? translations[key] : defaultValue;
  };

  return (
    <LanguageContext.Provider value={{ t, currentLanguage, changeLanguage, translationsEnabled, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
