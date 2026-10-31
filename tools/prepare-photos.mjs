/**
 * Готовит фотографии для страницы.
 *
 * Исходник mentor-original.jpg — готовая фотография. Копируем её без
 * обрезки, увеличения и повторного JPEG-сжатия; размеры для экранов и
 * WebP-версии подготовит Astro при сборке.
 *
 * Запуск: npm run photos
 */
import sharp from 'sharp';
import { copyFile, stat } from 'node:fs/promises';

await copyFile('assets-source/mentor-original.jpg', 'src/assets/mentor.jpg');
const info = await sharp('src/assets/mentor.jpg').metadata();
const { size } = await stat('src/assets/mentor.jpg');

console.log(`src/assets/mentor.jpg ${info.width}x${info.height} ${(size / 1024).toFixed(0)}KB`);
