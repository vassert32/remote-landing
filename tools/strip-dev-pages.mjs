/**
 * Выкидывает служебные страницы из готовой сборки.
 *
 * Astro строит всё, что лежит в src/pages, и разделения «только для dev» у
 * него нет. Пробник визуализаций /viz нужен в разработке, но в проде он
 * лишний: ниоткуда не слинкован, показывает невнедрённые идеи и попадает
 * в выдачу, если поисковик наткнётся на адрес.
 *
 * Запускается автоматически после astro build (см. package.json).
 */
import { rm, access } from 'node:fs/promises';
import { join } from 'node:path';

const DEV_ONLY = ['viz', 'fold'];
const DIST = 'dist';

for (const page of DEV_ONLY) {
  const dir = join(DIST, page);
  try {
    await access(dir);
  } catch {
    continue; // страницы нет — значит уже вычищена
  }
  await rm(dir, { recursive: true, force: true });
  console.log(`[strip] служебная страница /${page} убрана из сборки`);
}
