// Records a short, silent screen capture of the live client sites being scrolled (real footage of the work).
// Usage: node scripts/record-reel.mjs   → public/media/reel.webm (raw; encode the final webm, mp4 and poster with ffmpeg, skipping the blank start)
import { chromium } from 'playwright';
import { mkdtemp, rename, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sites = ['https://centrosamary.com/', 'https://gimnasioarmagedon.com/'];
const size = { width: 1280, height: 800 };
const dir = await mkdtemp(join(tmpdir(), 'reel-'));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: size, recordVideo: { dir, size }, locale: 'es-AR' });
const page = await ctx.newPage();
for (const url of sites) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  // A slow, even scroll down two and a half screens.
  await page.evaluate(async () => {
    const total = window.innerHeight * 2.5, steps = 140;
    for (let s = 1; s <= steps; s++) { window.scrollTo(0, (total * s) / steps); await new Promise((r) => setTimeout(r, 32)); }
  });
  await page.waitForTimeout(900);
}
await ctx.close();
await browser.close();
const [file] = await readdir(dir);
const out = fileURLToPath(new URL('../public/media/reel.webm', import.meta.url));
await rename(join(dir, file), out);
await rm(dir, { recursive: true, force: true });
console.log('ok', out);
