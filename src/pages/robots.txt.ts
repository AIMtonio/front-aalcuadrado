import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const mapa = new URL(`${base}sitemap-index.xml`, site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${mapa}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
