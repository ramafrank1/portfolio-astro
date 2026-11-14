// Visual + functional QA against the built site (run `npm run preview` first).
// Usage: node scripts/qa.mjs [outDir] [--full]
// For each page × width: horizontal overflow, console errors, failed requests, broken images; saves screenshots.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.QA_BASE ?? 'http://localhost:4321';
const out = process.argv[2] ?? 'qa-out';
const full = process.argv.includes('--full');
const pages = ['/', '/en/', '/proyectos/armagedon/', '/proyectos/paleta/', '/en/projects/grasso-propiedades/', '/proyectos/forrajes-oeste-balba/', '/gracias/', '/no-existe/'];
const widths = full ? [320, 375, 390, 430, 768, 1024, 1440, 1920] : [375, 1440];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
let problems = 0;

for (const path of pages) {
  for (const width of widths) {
    const mobile = width < 768;
    const ctx = await browser.newContext({ viewport: { width, height: mobile ? 800 : 900 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && !(path.includes('no-existe') && m.text().includes('404')) && errors.push(`console: ${m.text()}`));
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
    page.on('response', (r) => r.status() >= 400 && !r.url().includes('no-existe') && errors.push(`http ${r.status()}: ${r.url()}`));

    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    // Scroll through so reveal animations and lazy images trigger.
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    });
    await page.waitForTimeout(1300);
    const report = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - doc.clientWidth;
      const wide = [...document.querySelectorAll('body *')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > doc.clientWidth + 1) && getComputedStyle(el).position !== 'fixed' && !el.closest('.strip, .moments, .drift, .ring, .tile--word, .nav__list'); })
        .slice(0, 5).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} right=${Math.round(el.getBoundingClientRect().right)}`);
      const brokenImgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
      const hidden = [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity === '0').length;
      return { overflow, wide, brokenImgs, hidden };
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const name = `${path.replace(/\//g, '_') || 'home'}-${width}`;
    await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
    const issues = [
      ...(report.overflow > 0 ? [`horizontal overflow ${report.overflow}px ${report.wide.join(' | ')}`] : []),
      ...report.brokenImgs.map((s) => `broken image ${s}`),
      ...(report.hidden ? [`${report.hidden} reveal elements still hidden`] : []),
      ...errors,
    ];
    problems += issues.length;
    console.log(`${issues.length ? '✗' : '✓'} ${path} @${width}${issues.length ? '\n   ' + issues.join('\n   ') : ''}`);
    await ctx.close();
  }
}
await browser.close();
console.log(problems ? `\n${problems} problem(s)` : '\nAll checks passed');
process.exitCode = problems ? 1 : 0;
