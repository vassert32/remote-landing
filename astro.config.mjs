// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  // Боевой домен. DEPLOY_SITE переопределяет его для стенда на GitHub Pages.
  // DEPLOY_SITE / DEPLOY_BASE задаёт CI: тестовый стенд на GitHub Pages живёт
  // в подпапке репозитория, и все внутренние пути собираются от base.
  // DEPLOY_BASE передаётся БЕЗ ведущего слэша («remote-landing»): Git Bash на
  // Windows перемалывает env-значения, похожие на абсолютный путь, в
  // «C:/Program Files/Git/…» — слэш дописываем здесь сами.
  site: process.env.DEPLOY_SITE || 'https://remote-mentor.ru',
  base: process.env.DEPLOY_BASE ? `/${process.env.DEPLOY_BASE.replace(/^\/+/, '')}` : '/',
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
