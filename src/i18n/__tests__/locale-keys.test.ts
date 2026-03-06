import { en } from '../locales/en';
import { ja } from '../locales/ja';

/** Recursively collect all leaf-key paths from a nested object */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      keys.push(...collectKeys(val as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe('i18n locale key sync', () => {
  const enKeys = collectKeys(en as unknown as Record<string, unknown>);
  const jaKeys = collectKeys(ja as unknown as Record<string, unknown>);

  it('en and ja should have the same set of keys', () => {
    const missingInJa = enKeys.filter((k) => !jaKeys.includes(k));
    const extraInJa = jaKeys.filter((k) => !enKeys.includes(k));

    if (missingInJa.length > 0 || extraInJa.length > 0) {
      const messages: string[] = [];
      if (missingInJa.length) messages.push(`Missing in ja:\n  ${missingInJa.join('\n  ')}`);
      if (extraInJa.length) messages.push(`Extra in ja:\n  ${extraInJa.join('\n  ')}`);
      fail(messages.join('\n'));
    }
  });

  it('function-typed keys should be functions in both locales', () => {
    const getVal = (obj: Record<string, unknown>, path: string): unknown =>
      path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);

    for (const key of enKeys) {
      const enVal = getVal(en as unknown as Record<string, unknown>, key);
      const jaVal = getVal(ja as unknown as Record<string, unknown>, key);
      if (typeof enVal === 'function') {
        expect(typeof jaVal).toBe('function');
      }
    }
  });
});
