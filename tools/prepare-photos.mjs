/**
 * Готовит фотографии для страницы.
 *
 * Исходник mentor-original.jpg это скриншот из iCloud в мобильном браузере:
 * сверху статус-бар и шапка галереи, снизу лента миниатюр, панель иконок и
 * адресная строка. Вырезаем сам кадр и увеличиваем вдвое под ретину,
 * сохраняя исходные цвета фотографии.
 *
 * Запуск: npm run photos
 */
import sharp from 'sharp';

// Кадр внутри скриншота 590x1280.
const CROP = { left: 0, top: 215, width: 590, height: 780 };

const info = await sharp('assets-source/mentor-original.jpg')
  .extract(CROP)
  .resize({ width: CROP.width * 2, height: CROP.height * 2, kernel: 'lanczos3' })
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
  .toFile('src/assets/mentor.jpg');

console.log(`src/assets/mentor.jpg ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
