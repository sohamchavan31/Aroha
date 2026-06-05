import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../i18n/translations';

const LANG_KEY = 'aroha_language';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then(saved => {
      if (saved && translations[saved]) setLanguageState(saved);
    });
  }, []);

  async function setLanguage(code) {
    if (!translations[code]) return;
    setLanguageState(code);
    await AsyncStorage.setItem(LANG_KEY, code);
  }

  function t(key) {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
