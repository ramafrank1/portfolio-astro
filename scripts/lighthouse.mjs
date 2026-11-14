// Runs Lighthouse (mobile + desktop) against the local preview and prints scores + failing audits.
// Usage: node scripts/lighthouse.mjs [outDir]   (run `npm run preview` first)
// Chromium is launched through Playwright (more reliable on Windows than chrome-launcher).
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.env.QA_BASE ?? 'http://localhost:4321';
const out = process.argv[2] ?? 'lh-out';
const paths = ['/', '/en/', '/proyectos/paleta/', '/en/projects/bulk-gym/'];
await mkdir(out, { recursive: true });

const PORT = 9333;
const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
for (const path of paths) {
  for (const preset of ['mobile', 'desktop']) {
    const config = preset === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
    const { lhr } = await lighthouse(BASE + path, { port: PORT, output: 'json', logLevel: 'error' }, config);
    await writeFile(`${out}/${preset}${path.replace(/\//g, '_')}.json`, JSON.stringify(lhr));
    const scores = Object.values(lhr.categories).map((c) => `${c.title}: ${Math.round(c.score * 100)}`).join(' · ');
    const a = lhr.audits;
    console.log(`${preset.padEnd(7)} ${path.padEnd(26)} ${scores} | LCP ${a['largest-contentful-paint'].displayValue} · CLS ${a['cumulative-layout-shift'].displayValue} · TBT ${a['total-blocking-time'].displayValue}`);
    for (const [id, audit] of Object.entries(a)) {
      if (audit.score !== null && audit.score < 0.9 && ['binary', 'numeric', 'metricSavings'].includes(audit.scoreDisplayMode)) console.log(`   - ${id} ${audit.displayValue ?? ''}`);
    }
  }
}
await browser.close();
