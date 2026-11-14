// Renders favicons and Open Graph images with the site's typeface and palette (Playwright + HTML).
// Usage: npm run assets   → writes to public/ and public/og/
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const pub = (p) => fileURLToPath(new URL(`public/${p}`, root));
const shot = async (name) => (await readFile(new URL(`src/assets/shots/${name}`, root))).toString('base64');
const inter = (await readFile(new URL('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', root))).toString('base64');

const css = `
@font-face { font-family: I; src: url(data:font/woff2;base64,${inter}) format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #0f0e12; color: #f6f8f7; font-family: I; overflow: hidden; }
.name { font-size: 30px; font-weight: 450; letter-spacing: -.01em; }
.note { font-size: 26px; font-weight: 400; color: #a6a5ab; }
.go { display: inline-block; padding: 14px 24px; background: #f0a800; color: #000; font-size: 26px; font-weight: 450; }
`;

const ogGeneric = (lineA, lineB, sub, cta) => `
<style>${css}
.wrap { position: absolute; inset: 56px 64px; display: flex; flex-direction: column; justify-content: space-between; }
h1 { font-size: 112px; line-height: .95; letter-spacing: -.045em; font-weight: 300; }
.row { display: flex; justify-content: space-between; align-items: flex-end; }
</style>
<div class="wrap">
  <div class="row"><span class="name">Ramiro Frank</span><span class="note">Buenos Aires, Argentina</span></div>
  <h1>${lineA}<br>${lineB}</h1>
  <div class="row"><span class="note">${sub}</span><span class="go">${cta}</span></div>
</div>`;

const ogProject = (name, kind, img) => `
<style>${css}
.l { position: absolute; left: 56px; top: 56px; bottom: 56px; width: 450px; display: flex; flex-direction: column; justify-content: space-between; }
h1 { font-size: 78px; line-height: .95; letter-spacing: -.045em; font-weight: 300; }
p { font-size: 30px; font-weight: 300; line-height: 1.2; color: #a6a5ab; margin-top: 20px; }
.shot { position: absolute; left: 540px; top: 0; bottom: 0; width: 660px; overflow: hidden; }
.shot img { display: block; height: 100%; width: 100%; object-fit: cover; object-position: left top; }
</style>
<div class="l">
  <span class="name">Ramiro Frank</span>
  <div><h1>${name}</h1><p>${kind}</p></div>
</div>
<div class="shot"><img src="data:image/png;base64,${img}"></div>`;

const icon = (size, pad) => {
  const s = size - pad * 2;
  return `
<style>body{width:${size}px;height:${size}px;background:#f6f8f7;margin:0;display:grid;place-items:center}
.m{position:relative;width:${s}px;height:${s}px;background:#0f0e12}
.m::after{content:'';position:absolute;right:0;bottom:0;width:${Math.round(s * 0.4)}px;height:${Math.round(s * 0.4)}px;background:#f0a800}</style>
<div class="m"></div>`;
};

const projects = [
  { slug: 'samary', name: 'Samary', es: 'Sitio para un centro de salud mental', en: 'Website for a mental health center', img: 'samary-home-desktop.png' },
  { slug: 'distribuidora-vyp', name: 'Distribuidora V&P', es: 'Catálogo con pedidos por WhatsApp y panel para una distribuidora', en: 'Catalog with WhatsApp ordering and admin panel for a distributor', img: 'distribuidora-home-desktop.png' },
  { slug: 'vyp-gestion', name: 'VYP Gestión', es: 'Punto de venta y control operativo para una fiambrería', en: 'Point of sale and operations control for a deli', img: 'vyp-panel-desktop.png' },
  { slug: 'armagedon', name: 'Armagedon', es: 'Sitio, gestión y portal del alumno para un gimnasio', en: 'Website, management system and member portal for a gym', img: 'armagedon-home-desktop.png' },
  { slug: 'paleta', name: 'Paleta', es: 'Sistema de gestión para pinturerías', en: 'Management system for paint stores', img: 'paleta-pos-desktop.png' },
  { slug: 'bulk-gym', name: 'Bulk Gym', es: 'Sitio, gestión y portal del socio para un gimnasio', en: 'Website, management system and member portal for a gym', img: 'bulkgym-home-desktop.png' },
  { slug: 'grasso-propiedades', name: 'Grasso Propiedades', es: 'Catálogo de propiedades con panel para inmobiliaria', en: 'Property catalog with admin panel for a real estate agency', img: 'grasso-home-desktop.png' },
  { slug: 'forrajes-oeste-balba', name: 'Forrajes Oeste Balba', es: 'Catálogo con pedidos por WhatsApp', en: 'Catalog with WhatsApp ordering', img: 'forrajes-home-desktop.png' },
];

await mkdir(pub('og'), { recursive: true });
const browser = await chromium.launch();
const render = async (html, w, h, out) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out });
  await page.close();
  console.log('ok', out.split(/[\\/]/).slice(-2).join('/'));
};

await render(ogGeneric('Webs y sistemas', 'para tu negocio', 'Desarrollador web freelance', 'Pedir presupuesto'), 1200, 630, pub('og/og-es.png'));
await render(ogGeneric('Websites &amp; systems', 'for your business', 'Freelance web developer', 'Get a quote'), 1200, 630, pub('og/og-en.png'));
for (const p of projects) {
  const img = await shot(p.img);
  await render(ogProject(p.name, p.es, img), 1200, 630, pub(`og/${p.slug}-es.png`));
  await render(ogProject(p.name, p.en, img), 1200, 630, pub(`og/${p.slug}-en.png`));
}
await render(icon(32, 3), 32, 32, pub('favicon-32.png'));
await render(icon(180, 26), 180, 180, pub('apple-touch-icon.png'));
await render(icon(192, 28), 192, 192, pub('icon-192.png'));
await render(icon(512, 76), 512, 512, pub('icon-512.png'));
await browser.close();
