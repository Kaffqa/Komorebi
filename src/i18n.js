import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import idTranslation from './locales/id/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  id: {
    translation: idTranslation,
  },
};

// Retrieve language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('komorebi_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

// Save to localStorage whenever language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('komorebi_language', lng);
});

export default i18n;
