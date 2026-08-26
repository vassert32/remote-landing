/**
 * Копирует нужные подмножества шрифтов из node_modules в public/fonts.
 * latin-ext обязателен: в нём живёт знак рубля U+20BD (U+20AD-20C0).
 * Запуск: npm run fonts:sync
 */
import { copyFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'public/fonts';
const SUBSETS = ['latin', 'latin-ext', 'cyrillic'];

/** Переменные семейства: один файл на подмножество. */
const VARIABLE = [
  { pkg: '@fontsource-variable/onest', file: 'onest' },
  { pkg: '@fontsource-variable/unbounded', file: 'unbounded' },
];

/** Статические семейства: файл на вес. */
const STATIC = [{ pkg: '@fontsource/ibm-plex-mono', file: 'ibm-plex-mono', weights: [400, 600] }];

mkdirSync(OUT, { recursive: true });

// Прибираем устаревшее, чтобы в public не копились мёртвые шрифты.
for (const f of readdirSync(OUT)) unlinkSync(join(OUT, f));

for (const { pkg, file } of VARIABLE) {
  for (const subset of SUBSETS) {
    const name = `${file}-${subset}-wght-normal.woff2`;
    copyFileSync(join('node_modules', pkg, 'files', name), join(OUT, name));
    console.log('copied', name);
  }
}

for (const { pkg, file, weights } of STATIC) {
  for (const w of weights) {
    for (const subset of SUBSETS) {
      const name = `${file}-${subset}-${w}-normal.woff2`;
      copyFileSync(join('node_modules', pkg, 'files', name), join(OUT, name));
      console.log('copied', name);
    }
  }
}
