import { useEffect, useMemo, useState } from 'react';
import { I18nContext } from './i18nContext';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations } from './translations';

const STORAGE_KEY = 'classbop:language';

function getInitialLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
  if (translations[savedLanguage]) return savedLanguage;

  const browserLanguage = window.navigator.language?.toLowerCase();
  if (browserLanguage?.startsWith('ko')) return 'ko';
  if (browserLanguage?.startsWith('uz')) return 'uz';

  return DEFAULT_LANGUAGE;
}

function getTranslation(locale, key) {
  return key.split('.').reduce((value, segment) => {
    if (value && Object.prototype.hasOwnProperty.call(value, segment)) {
      return value[segment];
    }

    return undefined;
  }, locale);
}

function interpolate(value, params) {
  if (typeof value !== 'string' || !params) return value;

  return value.replace(/\{\{(\w+)\}\}/g, (_, name) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : ''
  ));
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const setLanguage = (nextLanguage) => {
      if (translations[nextLanguage]) setLanguageState(nextLanguage);
    };

    const t = (key, params) => {
      const localeValue = getTranslation(translations[language], key);
      const fallbackValue = getTranslation(translations[DEFAULT_LANGUAGE], key);
      const valueToUse = localeValue ?? fallbackValue ?? key;
      return interpolate(valueToUse, params);
    };

    return {
      language,
      languages: SUPPORTED_LANGUAGES,
      setLanguage,
      t,
    };
  }, [language]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
