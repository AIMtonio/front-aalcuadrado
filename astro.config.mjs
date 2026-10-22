// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL y BASE_PATH los define el GitHub Action al publicar en GitHub Pages.
// En Vercel, si no se define SITE_URL, se usa el dominio de producción del proyecto.
// En local no hace falta tocarlos.
const dominioVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL ?? (dominioVercel ? `https://${dominioVercel}` : 'https://aimtonio.github.io');
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  // Fuentes de Google Fonts, descargadas al compilar y servidas desde el mismo sitio
  // (más rápido y sin bloquear el render).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Unbounded',
      cssVariable: '--fuente-titulos',
      weights: ['600', '700'],
      subsets: ['latin'],
      fallbacks: ['Arial Black', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'DM Sans',
      cssVariable: '--fuente-texto',
      weights: ['400', '500', '700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
