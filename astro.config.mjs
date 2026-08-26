// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  // TODO: заменить на боевой домен, когда он появится (нужно для canonical и og:url)
  site: 'https://gerkulesov.dev',
  integrations: [icon()],
  build: { inlineStylesheets: 'auto' },
  image: { responsiveStyles: true },
});
