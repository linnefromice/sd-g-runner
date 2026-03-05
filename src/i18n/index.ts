import { getLocales } from 'expo-localization';
import { en, type Translations } from './locales/en';
import { ja } from './locales/ja';
import { useSaveDataStore } from '@/stores/saveDataStore';

export type LocaleSetting = 'system' | 'en' | 'ja';
export type ResolvedLocale = 'en' | 'ja';

const DICTIONARIES: Record<ResolvedLocale, Translations> = { en, ja };

export function resolveLocale(setting: LocaleSetting): ResolvedLocale {
  if (setting !== 'system') return setting;
  const deviceLang = getLocales()[0]?.languageCode ?? 'en';
  return deviceLang === 'ja' ? 'ja' : 'en';
}

export function getTranslation(setting?: LocaleSetting): Translations {
  const locale = resolveLocale(setting ?? useSaveDataStore.getState().settings.locale);
  return DICTIONARIES[locale];
}

export function useTranslation(): Translations {
  const locale = useSaveDataStore((s) => s.settings.locale);
  return DICTIONARIES[resolveLocale(locale)];
}
