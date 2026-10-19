/**
 * Genera las imágenes de marca en public/:
 * - og.png (1200×630) para Open Graph y Twitter Card
 * - logo.png (512×512) para datos estructurados
 * - apple-touch-icon.png (180×180)
 *
 * Uso: npm run og:generar
 */
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const publico = new URL('../public/', import.meta.url).pathname;
const simbolo = readFileSync(new URL('../src/assets/marca/aalcuadrado-simbolo.svg', import.meta.url), 'utf8');
const interior = simbolo.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// Símbolo (viewBox 112 46 196 196) colocado en un lienzo mayor.
const conSimbolo = (x, y, tam, extra = '', fondo = '#FFFFFF', ancho = 1200, alto = 630) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">
  <rect width="100%" height="100%" fill="${fondo}"/>
  <svg x="${x}" y="${y}" width="${tam}" height="${tam}" viewBox="112 46 196 196">${interior}</svg>
  ${extra}
</svg>`;

const og = conSimbolo(
  110,
  155,
  320,
  `<text x="500" y="320" font-family="Unbounded, 'Arial Black', Helvetica, Arial, sans-serif" font-size="84" font-weight="900" letter-spacing="-3" fill="#17142B">aalcuadrado</text>
   <text x="504" y="392" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#5C5878">Aretes mexicanos impresos en 3D</text>
   <rect x="0" y="606" width="1200" height="24" fill="#3B2A9B"/>`,
);

await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(`${publico}og.png`);
await sharp(Buffer.from(conSimbolo(56, 56, 400, '', '#FFFFFF', 512, 512))).png().toFile(`${publico}logo.png`);
await sharp(Buffer.from(conSimbolo(20, 20, 140, '', '#FFFFFF', 180, 180))).png().toFile(`${publico}apple-touch-icon.png`);

console.log('Listo: public/og.png, public/logo.png y public/apple-touch-icon.png');
