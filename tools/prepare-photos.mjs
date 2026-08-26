/**
 * Готовит фотографии для страницы.
 *
 * Исходник mentor-original.jpg это скриншот из iCloud в мобильном браузере:
 * сверху статус-бар и шапка галереи, снизу лента миниатюр, панель иконок и
 * адресная строка. Вырезаем сам кадр, увеличиваем вдвое под ретину и переводим
 * в монохром, сведённый к палитре страницы: красная мебель на фоне спорила
 * с единственным акцентом макета.
 *
 * Запуск: npm run photos
 */
import sharp from 'sharp';

const LUMA = [0.2126, 0.7152, 0.0722];

// Кадр внутри скриншота 590x1280.
const CROP = { left: 0, top: 215, width: 590, height: 780 };

// Отображение диапазона в цвета страницы: чёрная точка на --ink #12120f,
// белая на --paper #f2f1ed.
const SCALE = [0.878, 0.875, 0.871];
const OFFSET = [18, 18, 15];

const info = await sharp('assets-source/mentor-original.jpg')
  .extract(CROP)
  .resize({ width: CROP.width * 2, height: CROP.height * 2, kernel: 'lanczos3' })
  .recomb([LUMA, LUMA, LUMA])
  .normalise()
  .gamma(1.06)
  .linear(SCALE, OFFSET)
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
  .toFile('src/assets/mentor.jpg');

console.log(`src/assets/mentor.jpg ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
