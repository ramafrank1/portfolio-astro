// Captures real screenshots of the portfolio projects (desktop + mobile).
// Usage: npm run shots [-- slug]   → writes PNGs to src/assets/shots/
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = new URL('../src/assets/shots/', import.meta.url);

const targets = [
  { slug: 'samary', pages: { home: 'https://centrosamary.com/', inner: 'https://centrosamary.com/psicologia-adultos' } },
  { slug: 'distribuidora', pages: { home: 'https://distribuidora-vyp.pages.dev/' } },
  { slug: 'armagedon', pages: { home: 'https://gimnasioarmagedon.com/', inner: 'https://gimnasioarmagedon.com/planes', schedule: 'https://gimnasioarmagedon.com/cronograma' } },
  // Offline since late Oct 2026 (404); the guard below keeps their last good captures.
  { slug: 'grasso', pages: { home: 'https://grasso-propiedades.netlify.app/', inner: 'https://grasso-propiedades.netlify.app/propiedades' } },
  { slug: 'forrajes', pages: { home: 'https://forrajes-oeste-balba.netlify.app/', inner: 'https://forrajes-oeste-balba.netlify.app/productos' } },
  { slug: 'bulkgym', pages: { home: 'https://bulkgym-bellavista.netlify.app/', inner: 'https://bulkgym-bellavista.netlify.app/planes' } },
  { slug: 'paleta', pages: { home: 'https://paleta-7y3d.onrender.com/' } },
];

const viewports = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const only = process.argv[2];
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const t of targets.filter((t) => !only || t.slug === only)) {
  for (const [vpName, vp] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ ...vp, reducedMotion: 'reduce', locale: 'es-AR' });
    const page = await ctx.newPage();
    for (const [pageName, url] of Object.entries(t.pages)) {
      try {
        const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
        // Never overwrite a good capture with an error page (a site taken offline returns 404 "Site not found").
        if (!res || res.status() >= 400 || /site not found/i.test(await page.title())) {
          console.log('SKIP', t.slug, pageName, vpName, `HTTP ${res?.status()} — site offline, keeping the previous capture`);
          continue;
        }
        // Trigger lazy images, then return to top.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
          window.scrollTo(0, 0);
        });
        // Hide the hosting badge overlay ("Powered by Netlify" iframe); it is not part of the site's design.
        // Sites with a strict CSP (e.g. centrosamary.com) reject inline styles; they have no badge anyway.
        await page.addStyleTag({ content: '#nl-badge-frame{display:none!important}' }).catch(() => {});
        await page.waitForTimeout(1200);
        const file = new URL(`${t.slug}-${pageName}-${vpName}.png`, OUT);
        await page.screenshot({ path: fileURLToPath(file), fullPage: false });
        console.log('ok', t.slug, pageName, vpName);
        if (pageName === 'home' && vpName === 'desktop') {
          for (const n of [1, 2]) {
            await page.evaluate((y) => window.scrollTo(0, y), n * 900);
            await page.waitForTimeout(700);
            await page.screenshot({ path: fileURLToPath(new URL(`${t.slug}-scroll${n}-${vpName}.png`, OUT)) });
          }
        }
      } catch (e) {
        console.log('FAIL', t.slug, pageName, vpName, e.message.split('\n')[0]);
      }
    }
    await ctx.close();
  }
}
await browser.close();
