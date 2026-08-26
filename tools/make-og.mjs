/**
 * Собирает превью для соцсетей (public/og.jpg, 1200x630).
 *
 * Рисуется тем же шрифтом, что и страница. resvg не умеет woff2 и не знает
 * псевдонимов fontsource, поэтому подмножества распаковываются в ttf, а в
 * font-family уходит настоящее имя семейства из таблицы name: Onest,
 * JetBrains Mono.
 *
 * Результат коммитится в репозиторий: в CI пересобирать превью незачем.
 * Запуск: npm run og
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { decompress } from 'wawoff2';
import sharp from 'sharp';

const SUBSETS = [
  'onest-cyrillic',
  'onest-latin',
  'onest-latin-ext',
  'jetbrains-mono-cyrillic',
  'jetbrains-mono-latin',
  'jetbrains-mono-latin-ext',
];

const CACHE = '.cache/fonts';
mkdirSync(CACHE, { recursive: true });

for (const name of SUBSETS) {
  const ttf = await decompress(readFileSync(`public/fonts/${name}-wght-normal.woff2`));
  writeFileSync(`${CACHE}/${name}.ttf`, Buffer.from(ttf));
}

const PAPER = '#f2f1ed';
const INK = '#12120f';
const MUTE = '#6a6a62';
const STAMP = '#1f31d6';
const RULE = 'rgba(18,18,15,0.32)';

const micro = (x, y, text, fill = MUTE, anchor = 'start') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="JetBrains Mono" font-size="15" ` +
  `font-weight="600" letter-spacing="1.4" fill="${fill}">${text}</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>

  <!-- Шапка документа -->
  ${micro(80, 86, 'ЕВГЕНИЙ ГЕРКУЛЕСОВ', INK)}
  ${micro(1120, 86, 'TELEGRAM @GERKULESOV35', MUTE, 'end')}
  <rect x="80" y="110" width="1040" height="1" fill="${RULE}"/>

  <!-- Заявление. resvg рисует только дефолтный инстанс переменного шрифта,
       поэтому насыщенность добирается обводкой того же цвета: иначе заголовок
       выходит заметно светлее, чем на самой странице. -->
  <g fill="${INK}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"
     paint-order="stroke" font-family="Onest" font-size="98">
    <!-- resvg не подтягивает кернинг перед точкой, поэтому сдвигаем вручную. -->
    <text x="80" y="296">Тот же опыт<tspan dx="-19">.</tspan></text>
    <text x="80" y="400">Другая валюта<tspan dx="-19">.</tspan></text>
  </g>

  <text x="80" y="478" font-family="Onest" font-size="26"
        fill="${MUTE}">Менторство до удалённого оффера за 3-4 месяца</text>

  <!-- Печать -->
  <g transform="translate(1010 268) rotate(-6)">
    <rect x="-96" y="-27" width="192" height="54" fill="none" stroke="${STAMP}" stroke-width="3"/>
    <text x="0" y="8" text-anchor="middle" font-family="JetBrains Mono" font-size="19"
          font-weight="700" letter-spacing="2.2" fill="${STAMP}">ПОДТВЕРЖДЁН</text>
  </g>

  <!-- Подвал документа -->
  <rect x="80" y="524" width="1040" height="1" fill="${RULE}"/>
  ${micro(80, 566, '0 ₽ НА СТАРТЕ', INK)}
  ${micro(480, 566, '50% С ПЕРВОЙ ЗАРПЛАТЫ', INK)}
  ${micro(1120, 566, 'REMOTE UK / ЕВРОПА', INK, 'end')}
</svg>`;

const png = new Resvg(svg, {
  font: {
    fontFiles: readdirSync(CACHE).map((f) => `${CACHE}/${f}`),
    loadSystemFonts: false,
  },
})
  .render()
  .asPng();

const info = await sharp(png).jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toFile('public/og.jpg');
console.log(`public/og.jpg ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
