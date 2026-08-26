import { ru } from './ru';
import { en } from './en';

export type Lang = 'ru' | 'en';

/** Русский — язык по умолчанию: он живёт в корне, английский под /en. */
export const DEFAULT_LANG: Lang = 'ru';
export const LANGS: Lang[] = ['ru', 'en'];

const dict = { ru, en };

/** Словарь по локали. Английский повторяет структуру русского один в один. */
export function t(lang: string | undefined): typeof ru {
  return (dict[(lang as Lang) ?? DEFAULT_LANG] ?? ru) as typeof ru;
}

/** Постоянные ссылки, одинаковые для обоих языков. */
export const links = {
  telegram: 'https://t.me/gerkulesov35',
  // TODO(заказчик): реальные адреса — пустая строка рендерит слот неактивным.
  github: '',
  email: '',
  instagram: '',
};

/** Адрес соцсети по ключу из словаря. */
export function socialHref(key: string): string {
  return (links as Record<string, string>)[key] ?? '';
}

/** Префикс языка: русский в корне, английский под /en. */
export function base(lang: string | undefined): string {
  return lang === 'en' ? '/en' : '';
}

/** Абсолютный путь внутри текущего языка: path('en', '/terms') → '/en/terms'. */
export function path(lang: string | undefined, to: string): string {
  const prefix = base(lang);
  if (to === '/') return prefix || '/';
  return `${prefix}${to}`;
}

/** Тот же документ на другом языке. Для переключателя в хедере. */
export function otherLang(lang: string | undefined): Lang {
  return lang === 'en' ? 'ru' : 'en';
}

/**
 * Адреса юридических страниц: слаги переведены, поэтому живут в одном месте.
 * Ключи совпадают с ключами словаря docs.
 */
export const docPaths = {
  ru: { oferta: '/oferta', dogovor: '/dogovor', privacy: '/privacy' },
  en: { oferta: '/en/terms', dogovor: '/en/agreement', privacy: '/en/privacy' },
} as const;

export function docHref(lang: string | undefined, key: keyof typeof docPaths.ru): string {
  return docPaths[(lang as Lang) === 'en' ? 'en' : 'ru'][key];
}
