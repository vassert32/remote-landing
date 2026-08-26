/**
 * Копирует нужные подмножества переменных шрифтов из node_modules в public/fonts.
 * latin-ext обязателен: в нём живёт знак рубля U+20BD (U+20AD-20C0).
 * Запуск: npm run fonts:sync
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'public/fonts';
const SUBSETS = ['latin', 'latin-ext', 'cyrillic'];
const FAMILIES = [
  { pkg: '@fontsource-variable/onest', file: 'onest' },
  { pkg: '@fontsource-variable/jetbrains-mono', file: 'jetbrains-mono' },
];

mkdirSync(OUT, { recursive: true });

for (const { pkg, file } of FAMILIES) {
  for (const subset of SUBSETS) {
    const name = `${file}-${subset}-wght-normal.woff2`;
    copyFileSync(join('node_modules', pkg, 'files', name), join(OUT, name));
    console.log('copied', name);
  }
}
