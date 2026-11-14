// Interactive end-to-end checks against the local preview (run `npm run preview` first).
// Form submissions to Web3Forms are intercepted (nothing is sent) to exercise the success and
// failure paths and inspect the payload. Form tests need a build with PUBLIC_WEB3FORMS_KEY set.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE = process.env.QA_BASE ?? 'http://localhost:4321';
const browser = await chromium.launch();
const results = [];
async function test(name, fn, ctxOptions = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, ...ctxOptions });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await fn(page, ctx);
    assert.deepEqual(errors, [], `page errors: ${errors.join(' // ')}`);
    results.push(['✓', name]);
  } catch (e) {
    results.push(['✗', name, e.message.split('\n')[0]]);
  }
  await ctx.close();
}

await test('mobile menu opens, closes with Esc, and closes on link click', async (page) => {
  await page.goto(BASE + '/');
  const toggle = page.locator('[data-menu-toggle]');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await page.locator('#nav-list a[data-nav="servicios"]').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => document.getElementById('main').inert), true, 'page behind menu is inert');
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-toggle')), true, 'focus returns to toggle');
  await toggle.click();
  await page.locator('#nav-list a[data-nav="contacto"]').click();
  await page.waitForTimeout(900);
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(new URL(page.url()).hash, '#contacto');
  assert.ok(await page.locator('#contacto').isVisible());
  const top = await page.locator('#contacto').evaluate((e) => e.getBoundingClientRect().top);
  assert.ok(Math.abs(top) < 140, `anchor landed at ${Math.round(top)}px`);
}, { viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true });

await test('configurator shows the closest project and writes an encoded WhatsApp message', async (page) => {
  await page.goto(BASE + '/#contacto');
  await page.locator('[data-config-business]').selectOption('gimnasio');
  await page.locator('[data-config-need]').selectOption({ index: 2 });
  const url = new URL(await page.locator('[data-config-go]').getAttribute('href'));
  assert.equal(url.pathname, '/5491151060179');
  assert.match(url.searchParams.get('text'), /un gimnasio o estudio/);
  assert.match(url.searchParams.get('text'), /un sistema de gestión/);
  await page.locator('[data-config-business]').selectOption('catalogo');
  const msg = new URL(await page.locator('[data-config-go]').getAttribute('href')).searchParams.get('text');
  assert.match(msg, /por WhatsApp/, 'keeps WhatsApp capitalized');
  await page.locator('[data-config-business]').selectOption('gimnasio');
  assert.equal(await page.locator('[data-config-go]').getAttribute('target'), '_blank');
  assert.ok(await page.locator('[data-closest="armagedon"]').isVisible(), 'closest project shown');
  assert.ok(await page.locator('[data-closest="samary"]').isHidden(), 'others hidden');
});

await test('project strips scroll sideways inside the page, on desktop and phone', async (page) => {
  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 800 }]) {
    await page.setViewportSize(size);
    await page.goto(BASE + '/');
    const r = await page.evaluate(() => { const s = document.querySelector('.strip'); return { sw: s.scrollWidth, cw: s.clientWidth, doc: document.documentElement.scrollWidth, img: s.querySelector('img').getBoundingClientRect().height, frame: s.querySelector('a').getBoundingClientRect().height }; });
    assert.ok(r.sw > r.cw, 'strip overflows its own box');
    assert.equal(r.cw, size.width);
    assert.equal(r.doc, size.width, 'no page overflow');
    assert.ok(Math.abs(r.img - r.frame) < 2, 'image fills its frame');
  }
});

await test('strip buttons move it with a mouse; pause controls work', async (page) => {
  await page.goto(BASE + '/');
  const strip = page.locator('[data-strip]').first();
  await page.locator('[data-strip-next]').first().click();
  await page.waitForFunction(() => document.querySelector('[data-strip]').scrollLeft > 100);
  assert.ok(await strip.evaluate((e) => e.scrollLeft) > 100);
  await page.locator('[data-drift-toggle]').click();
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('drift-paused')), true);
  await page.locator('[data-reel-toggle]').click();
  assert.match(await page.locator('[data-reel-toggle]').textContent(), /Reproducir/);
});

await test('honest labels: demos and proposals are not called clients', async (page) => {
  await page.goto(BASE + '/proyectos/grasso-propiedades/');
  assert.match(await page.locator('.facts th').first().textContent(), /Para/);
  await page.goto(BASE + '/proyectos/armagedon/');
  assert.match(await page.locator('.facts th').first().textContent(), /Cliente/);
});

await test('process row: buttons move it and the bar follows', async (page) => {
  await page.goto(BASE + '/#proceso');
  const row = page.locator('[data-moments]');
  await page.locator('[data-moments-next]').click();
  await page.waitForFunction(() => document.querySelector('[data-moments]').scrollLeft > 100);
  assert.ok(await row.evaluate((e) => e.scrollLeft) > 100);
  assert.ok(await page.locator('[data-moments-prev]').isEnabled());
});

await test('offline projects have no visit link; live ones do', async (page) => {
  await page.goto(BASE + '/');
  assert.equal(await page.locator('a[href*="netlify.app"]').count(), 0, 'no links to offline sites');
  assert.equal(await page.locator('a[href="https://centrosamary.com/"]').count() > 0, true);
  assert.equal(await page.locator('a[href="https://gimnasioarmagedon.com/"]').count() > 0, true);
  await page.goto(BASE + '/proyectos/grasso-propiedades/');
  assert.equal(await page.locator('a[href*="netlify.app"]').count(), 0);
});

await test('hero ring: pointing at a frame names the project', async (page) => {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.locator('.ring__item').first().hover();
  assert.match(await page.locator('[data-hero-lead]').textContent(), /Samary · 2026/);
  assert.ok(await page.locator('.ring__item img').first().isVisible(), 'frames hold images');
});

const hasForm = await (async () => { const c = await browser.newContext(); const p = await c.newPage(); await p.goto(BASE + '/'); const n = await p.locator('[data-contact-form]').count(); await c.close(); return n > 0; })();
if (hasForm) {
await test('form shows errors for invalid input and focuses the first invalid field', async (page) => {
  let posted = false;
  await page.route('https://api.web3forms.com/**', (route) => ((posted = true), route.fulfill({ status: 200, json: { success: true } })));
  await page.goto(BASE + '/#contacto');
  await page.locator('[data-contact-form] button[type="submit"]').click();
  assert.equal(posted, false, 'must not submit invalid form');
  assert.equal(await page.locator('#f-name').getAttribute('aria-invalid'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'f-name');
  assert.match(await page.locator('#f-name-err').textContent(), /nombre/i);
  await page.fill('#f-contact', 'no-es-un-mail');
  await page.locator('#f-contact').blur();
  assert.match(await page.locator('#f-contact-err').textContent(), /válido/);
  await page.fill('#f-contact', '+54 9 11 5555-1234');
  assert.equal(await page.locator('#f-contact').getAttribute('aria-invalid'), 'false');
});

await test('form success path: sends Web3Forms payload and confirms only on success:true', async (page) => {
  let body = '';
  await page.route('https://api.web3forms.com/**', async (route) => {
    body = route.request().postData() ?? '';
    await new Promise((r) => setTimeout(r, 300));
    return route.fulfill({ status: 200, json: { success: true, body: { message: 'Email sent successfully!' } } });
  });
  await page.goto(BASE + '/#contacto');
  await page.fill('#f-name', 'Cliente de prueba');
  await page.fill('#f-contact', 'cliente@prueba.test');
  await page.selectOption('#f-type', { index: 1 });
  await page.fill('#f-msg', 'Necesito un catálogo para mi negocio.');
  await page.locator('[data-contact-form] button[type="submit"]').click();
  assert.equal(await page.locator('[data-submit-label]').textContent(), 'Enviando…', 'loading state');
  await page.locator('[data-form-success]').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#f-name').isHidden(), true, 'fields hidden after success');
  // multipart/form-data body: check the fields that matter.
  const field = (name) => body.match(new RegExp(`name="${name}"\r\n\r\n([^\r]*)`))?.[1];
  assert.ok(field('access_key'), 'access key sent');
  assert.equal(field('nombre'), 'Cliente de prueba');
  assert.equal(field('email'), 'cliente@prueba.test', 'email copied for reply-to');
  assert.equal(field('idioma'), 'es');
  assert.equal(field('botcheck'), undefined, 'honeypot unchecked');
  assert.equal(field('redirect'), undefined, 'redirect only for no-JS');
});

await test('form failure path: shows an error and keeps the data', async (page) => {
  await page.route('https://api.web3forms.com/**', (route) => route.fulfill({ status: 400, json: { success: false, body: { message: 'Invalid' } } }));
  await page.goto(BASE + '/en/#contact');
  await page.fill('#f-name', 'Test client');
  await page.fill('#f-contact', 'client@test.test');
  await page.fill('#f-msg', 'I need a website for my business.');
  await page.locator('[data-contact-form] button[type="submit"]').click();
  await page.locator('[data-form-status]').filter({ hasText: /could not be sent/ }).waitFor();
  assert.equal(await page.locator('[data-form-success]').isHidden(), true);
  assert.equal(await page.inputValue('#f-name'), 'Test client');
  assert.equal(await page.locator('[data-contact-form] button[type="submit"]').isEnabled(), true);
});

} else {
  results.push(['–', 'form tests skipped: this build has no PUBLIC_WEB3FORMS_KEY, so the form is not rendered']);
}

await test('language switch maps each page to its translation', async (page) => {
  await page.goto(BASE + '/proyectos/paleta/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.locator('.tools a.tool').click();
  await page.waitForURL('**/en/projects/paleta/', { waitUntil: 'networkidle' });
  assert.equal(await page.getAttribute('html', 'lang'), 'en');
  await page.waitForTimeout(1200);
  await page.locator('.tools a.tool').click();
  await page.waitForURL('**/proyectos/paleta/');
});

await test('every project card and "next project" link resolves', async (page) => {
  await page.goto(BASE + '/');
  const hrefs = [...new Set(await page.locator('.facts__links a.link:first-child').evaluateAll((as) => as.map((a) => a.getAttribute('href'))))];
  assert.equal(hrefs.length, 8);
  for (const h of hrefs) {
    const res = await page.goto(BASE + h);
    assert.equal(res.status(), 200, h);
    const next = await page.locator('.next__link').getAttribute('href');
    assert.equal((await page.request.get(BASE + next)).status(), 200, next);
  }
});

await test('keyboard: first Tab reaches the skip link, which moves focus to main', async (page) => {
  await page.goto(BASE + '/');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.className), 'skip-link');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
});

await test('reduced motion: all content visible without scrolling', async (page) => {
  await page.goto(BASE + '/');
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('motion-ok')), false);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal], .line__in')].filter((e) => getComputedStyle(e).opacity === '0' || getComputedStyle(e).transform !== 'none').length);
  assert.equal(hidden, 0);
}, { reducedMotion: 'reduce' });

await test('without JavaScript: content, links and form are present and visible', async (page) => {
  await page.goto(BASE + '/');
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity === '0').length);
  assert.equal(hidden, 0);
  assert.ok(await page.locator('#nav-list a[data-nav="trabajos"]').isVisible(), 'nav links visible');
  if (await page.locator('form[data-contact-form]').count()) {
    assert.equal(await page.locator('form[data-contact-form]').getAttribute('action'), 'https://api.web3forms.com/submit');
    assert.match(await page.locator('form[data-contact-form] input[name="redirect"]').getAttribute('value'), /\/gracias\/$/);
  }
  assert.ok(await page.locator('[data-config-go]').isVisible());
  assert.equal(await page.locator('[data-copy]').isHidden(), true, 'copy button needs JS');
}, { javaScriptEnabled: false, viewport: { width: 375, height: 800 } });

await test('404 page is served for unknown URLs', async (page) => {
  const res = await page.goto(BASE + '/esta-pagina-no-existe/');
  assert.equal(res.status(), 404);
  assert.match(await page.locator('h1').textContent(), /no existe/);
});

await browser.close();
for (const [mark, name, err] of results) console.log(`${mark} ${name}${err ? `\n    ${err}` : ''}`);
const failed = results.filter((r) => r[0] === '✗').length;
console.log(failed ? `\n${failed} failed` : `\nAll ${results.length} e2e checks passed`);
process.exitCode = failed ? 1 : 0;
