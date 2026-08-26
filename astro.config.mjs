// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  // TODO: заменить на боевой домен, когда он появится (нужно для canonical и og:url)
  site: 'https://gerkulesov.dev',
  integrations: [icon()],
  build: { inlineStylesheets: 'auto' },
  image: { responsiveStyles: true },
  // Русский живёт в корне, английский под /en. Astro.currentLocale отдаёт
  // язык страницы, по нему компоненты берут словарь.
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  // Порт берём из PORT, если его назначил инструмент превью; иначе штатный 4321.
  server: {
    // Порт назначает инструмент превью через PORT; хост прибит к IPv4:
    // по умолчанию Astro садится только на ::1, куда встроенный браузер
    // достучаться не может.
    port: Number(process.env.PORT) || 4321,
    host: '127.0.0.1',
  },
});
