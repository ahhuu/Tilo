import { useUIStore } from '@/stores/uiStore';
import { translations, type TranslationKey } from './translations';

export type { Language, TranslationKey } from './translations';

export function useI18n() {
  const language = useUIStore((state) => state.language);
  const setLanguage = useUIStore((state) => state.setLanguage);

  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = translations[language] || translations['zh-CN'];
    return (langDict as Record<string, string>)[key] || fallback || key;
  };

  return { language, setLanguage, t };
}
