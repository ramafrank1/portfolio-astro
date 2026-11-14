// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config/site-url.mjs';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  compressHTML: true,
  build: { format: 'directory' },
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !/\/(gracias|thanks)\/$/.test(page),
      i18n: { defaultLocale: 'es', locales: { es: 'es-AR', en: 'en' } },
      // Case studies live at different paths per language (/proyectos/x/ ↔ /en/projects/x/),
      // so pair them explicitly; the i18n option above only pairs identical paths.
      serialize(item) {
        const m = item.url.match(/\/(?:proyectos|en\/projects)\/([^/]+)\/$/);
        if (m) {
          item.links = [
            { url: `${SITE_URL}/proyectos/${m[1]}/`, lang: 'es-AR' },
            { url: `${SITE_URL}/en/projects/${m[1]}/`, lang: 'en' },
          ];
        }
        return item;
      },
    }),
  ],
  image: { responsiveStyles: false },
  security: {
    csp: {
      scriptDirective: { resources: ["'self'", 'https://cloud.umami.is'] },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://cloud.umami.is https://api-gateway.umami.dev https://api.web3forms.com",
        "form-action 'self' https://api.web3forms.com",
        "base-uri 'self'",
      ],
    },
  },
});
