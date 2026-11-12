/** Ayudantes de los dibujos SVG de las vistas previas (kits y velas). */

/** Puntos de una estrella de `n` picos centrada en (cx, cy). */
export function estrella(cx: number, cy: number, exterior: number, interior: number, n = 5): string {
  return Array.from({ length: n * 2 }, (_, i) => {
    const radio = i % 2 === 0 ? exterior : interior;
    const angulo = (Math.PI / n) * i - Math.PI / 2;
    return `${(cx + radio * Math.cos(angulo)).toFixed(1)},${(cy + radio * Math.sin(angulo)).toFixed(1)}`;
  }).join(' ');
}
