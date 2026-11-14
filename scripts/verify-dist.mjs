// Static checks on the production build (run `npm run build` first). Exit code 1 on any failure.
// SEO metadata, hreflang, internal links, assets, WhatsApp links, forms, sitemap, CSP-safe markup.
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const WHATSAPP = '5491151060179';
const failures = [];
const fail = (msg) => failures.push(msg);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}
const exists = async (p) => stat(p).then(() => true, () => false);
const attr = (html, re) => html.match(re)?.[1];
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

const files = await walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));
const titles = new Map();
const descriptions = new Map();

for (const file of pages) {
  const rel = '/' + relative(DIST, file).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '/');
  const html = await readFile(file, 'utf8');
  const is404 = rel === '/404/';
  const noindex = /<meta name="robots" content="noindex"/.test(html);

  const title = attr(html, /<title>([^<]+)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]+)"/);
  if (!title) fail(`${rel}: missing <title>`);
  if (!desc) fail(`${rel}: missing meta description`);
  if (title && titles.has(title)) fail(`${rel}: duplicate title (also ${titles.get(title)})`);
  if (desc && descriptions.has(desc) && !is404) fail(`${rel}: duplicate description (also ${descriptions.get(desc)})`);
  titles.set(title, rel); descriptions.set(desc, rel);
  if (desc && (desc.length < 70 || desc.length > 200)) fail(`${rel}: description length ${desc.length}`);

  if (!/<html lang="(es-AR|en)"/.test(html)) fail(`${rel}: missing/invalid html lang`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(`${rel}: expected exactly one <h1>`);
  if (!noindex) {
    if (!/<link rel="canonical" href="https?:\/\/[^"]+"/.test(html)) fail(`${rel}: missing canonical`);
    if (!/hreflang="es-AR"/.test(html) || !/hreflang="en"/.test(html) || !/hreflang="x-default"/.test(html)) fail(`${rel}: missing hreflang alternates`);
  }
  const og = attr(html, /<meta property="og:image" content="([^"]+)"/);
  if (!og) fail(`${rel}: missing og:image`);
  else if (!(await exists(join(DIST, new URL(og).pathname)))) fail(`${rel}: og:image file not found ${og}`);

  for (const json of all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json); } catch { fail(`${rel}: invalid JSON-LD`); }
  }
  // CSP forbids inline style attributes.
  if (/\sstyle="/.test(html)) fail(`${rel}: inline style attribute (blocked by CSP)`);
  // Images need alt (decorative ones use an empty alt, serialized as a bare `alt`).
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) if (!/\salt(="|[\s>])/.test(img)) fail(`${rel}: <img> without alt`);
  // Placeholder text must never ship. (Case-sensitive TODO: "todo" is a Spanish word.)
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '');
  if (/lorem ipsum|example\.com/i.test(text) || /\b(TODO|FIXME|XXX)\b/.test(text)) fail(`${rel}: placeholder text`);

  // Internal links and assets resolve to built files.
  for (const href of all(html, /\s(?:href|src)="(\/[^"#?]*)/g)) {
    const target = join(DIST, decodeURIComponent(href));
    const ok = (await exists(target)) && (await stat(target)).isFile() || (await exists(join(target, 'index.html')));
    if (!ok) fail(`${rel}: broken internal link ${href}`);
  }
  for (const srcset of all(html, /\ssrcset="([^"]+)"/g)) {
    for (const part of srcset.split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u.startsWith('/') && !(await exists(join(DIST, u)))) fail(`${rel}: missing srcset file ${u}`);
    }
  }
  // External links open safely.
  for (const a of html.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? []) if (!/rel="[^"]*noopener/.test(a)) fail(`${rel}: target=_blank without noopener`);
  // WhatsApp links use the confirmed number and an encoded message.
  for (const wa of all(html, /href="(https:\/\/wa\.me\/[^"]+)"/g)) {
    const u = new URL(wa.replace(/&amp;/g, '&'));
    if (u.pathname !== `/${WHATSAPP}`) fail(`${rel}: WhatsApp link with wrong number ${u.pathname}`);
    if (!u.searchParams.get('text')) fail(`${rel}: WhatsApp link without message`);
    if (/\s/.test(u.search)) fail(`${rel}: WhatsApp message not encoded`);
  }
  // Contact form (only rendered when a Web3Forms key is configured) posts to Web3Forms with a honeypot.
  if (html.includes('data-contact-form')) {
    if (!/action="https:\/\/api\.web3forms\.com\/submit"/.test(html) || !/name="access_key" value="[^"]+"/.test(html) || !/name="botcheck"/.test(html)) fail(`${rel}: contact form not wired for Web3Forms`);
  }
}

// Sitemap and robots.
const sitemapIndex = await readFile(join(DIST, 'sitemap-index.xml'), 'utf8').catch(() => '');
if (!sitemapIndex) fail('sitemap-index.xml missing');
const sitemap = await readFile(join(DIST, 'sitemap-0.xml'), 'utf8').catch(() => '');
for (const must of ['/proyectos/paleta/', '/en/projects/paleta/', '/en/']) if (!sitemap.includes(must)) fail(`sitemap missing ${must}`);
if (/gracias|thanks|404/.test(sitemap)) fail('sitemap includes non-indexable pages');
const robots = await readFile(join(DIST, 'robots.txt'), 'utf8').catch(() => '');
if (!/Sitemap: https?:\/\/.+\/sitemap-index\.xml/.test(robots)) fail('robots.txt missing sitemap');
for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'site.webmanifest', '404.html']) if (!(await exists(join(DIST, f)))) fail(`missing ${f}`);
// No secrets or env files in the output.
if (files.some((f) => /\.env/.test(f))) fail('env file in dist');

console.log(`Checked ${pages.length} pages.`);
if (failures.length) { console.log(failures.map((f) => '✗ ' + f).join('\n')); process.exitCode = 1; }
else console.log('✓ All static checks passed');
