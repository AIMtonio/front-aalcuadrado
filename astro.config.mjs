// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dirección pública del sitio (enlaces absolutos, sitemap, imagen para compartir).
// En Vercel, si no se define SITE_URL, se usa el dominio de producción del proyecto.
const dominioVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL ?? (dominioVercel ? `https://${dominioVercel}` : 'https://aalcuadrado.antonioalonso.com.mx');

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  env: {
    schema: {
      // URL pública de la API (la misma que usa `npm run api:sincronizar`). El diseñador
      // con IA la llama desde el navegador, así que queda escrita en la página.
      // Sin ella, la sección "Diseña con IA" no aparece.
      API_URL: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },
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
