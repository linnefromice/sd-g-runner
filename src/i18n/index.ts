import { en, type Translations } from './locales/en';
import { ja } from './locales/ja';
import { useSaveDataStore } from '@/stores/saveDataStore';

export type LocaleSetting = 'system' | 'en' | 'ja';
export type ResolvedLocale = 'en' | 'ja';

const DICTIONARIES: Record<ResolvedLocale, Translations> = { en, ja };

let cachedDeviceLang: string | null = null;

function getDeviceLanguage(): string {
  if (cachedDeviceLang !== null) return cachedDeviceLang;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocales } = require('expo-localization');
    const lang: string = getLocales()[0]?.languageCode ?? 'en';
    cachedDeviceLang = lang;
  } catch {
    cachedDeviceLang = 'en';
  }
  return cachedDeviceLang!;
}

export function resolveLocale(setting: LocaleSetting | undefined): ResolvedLocale {
  if (setting === 'en' || setting === 'ja') return setting;
  return getDeviceLanguage() === 'ja' ? 'ja' : 'en';
}

export function getTranslation(setting?: LocaleSetting): Translations {
  const locale = resolveLocale(setting ?? useSaveDataStore.getState().settings.locale);
  return DICTIONARIES[locale];
}

export function useTranslation(): Translations {
  const locale = useSaveDataStore((s) => s.settings.locale);
  return DICTIONARIES[resolveLocale(locale)];
}
