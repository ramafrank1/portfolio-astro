// Captures Paleta's interior screens from its LOCAL demo (fictitious seed data).
// Prereq: in Desktop/monje/server run `npm run demo` (http://localhost:8080).
// Logs in through the demo's own quick-access "Dueño" button — no credentials in this script.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:8080';
const out = (name) => fileURLToPath(new URL(`../src/assets/shots/paleta-${name}.png`, import.meta.url));
const routes = { pos: '/vender', products: '/productos', prices: '/precios', reports: '/reportes', stock: '/stock' };

const browser = await chromium.launch();
for (const [vpName, opts] of Object.entries({
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: 'reduce', locale: 'es-AR' });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Dueño/ }).first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  for (const [name, path] of Object.entries(routes)) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.screenshot({ path: out(`${name}-${vpName}`) });
    console.log('ok', name, vpName);
  }
  await ctx.close();
}
await browser.close();
