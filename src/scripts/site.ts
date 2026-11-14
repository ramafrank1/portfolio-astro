// Client-side behaviour. Everything here is progressive enhancement: the page is fully
// readable and navigable without JavaScript.
import { inView, scroll } from 'motion';
import { track } from './analytics';

const root = document.documentElement;
const motionOk = root.classList.contains('motion-ok');
root.dataset.ready = '1'; // tells the inline watchdog in Base.astro that this script started
const $ = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) => ctx.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) => [...ctx.querySelectorAll<T>(sel)];

/* Header: one tone lighter once the page scrolls ------------------------------------ */
const header = $('[data-header]');
const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
requestAnimationFrame(onScroll);
window.addEventListener('scroll', onScroll, { passive: true });

/* Mobile menu ------------------------------------------------------------- */
const menuBtn = $<HTMLButtonElement>('[data-menu-toggle]');
const menu = $('#nav-list');
const menuLabel = $('[data-menu-label]');
function setMenu(open: boolean, returnFocus = true) {
  if (!menuBtn || !menu) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('is-open', open);
  if (menuLabel) menuLabel.textContent = open ? menuBtn.dataset.labelClose! : menuBtn.dataset.labelOpen!;
  document.body.style.overflow = open ? 'hidden' : '';
  // Keep keyboard and screen-reader focus inside the open menu.
  for (const el of document.querySelectorAll<HTMLElement>('#main, footer, .brand')) el.inert = open;
  if (open) $<HTMLAnchorElement>('a', menu)?.focus();
  else if (returnFocus) menuBtn.focus();
}
menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (e) => {
  if ((e.target as Element).closest('a')) setMenu(false, false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuBtn?.getAttribute('aria-expanded') === 'true') setMenu(false);
});
window.matchMedia('(min-width: 64rem)').addEventListener('change', (e) => e.matches && setMenu(false, false));

/* Active section in the nav (home page) ---------------------------------- */
const navLinks = $$<HTMLAnchorElement>('[data-nav]');
const sections = navLinks.map((l) => document.getElementById(l.dataset.nav!)).filter(Boolean) as HTMLElement[];
if (sections.length && $('[data-hero]')) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        navLinks.forEach((l) => {
          const active = l.dataset.nav === entry.target.id; // the hero matches no link → clears
          l.classList.toggle('is-active', active);
          if (active) l.setAttribute('aria-current', 'true');
          else l.removeAttribute('aria-current');
        });
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  [$('[data-hero]')!, ...sections].forEach((s) => io.observe(s));
}

/* Live local time in Buenos Aires ----------------------------------------- */
$$<HTMLTimeElement>('[data-clock]').forEach((clock) => {
  const fmt = new Intl.DateTimeFormat(clock.dataset.locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: clock.dataset.tz });
  const tick = () => { clock.textContent = `${fmt.format(new Date())} · GMT−3`; };
  tick();
  setInterval(tick, 30_000);
});

/* Entrances --------------------------------------------------------------- */
// Runs `fn` once the page has painted at least once. Entrances must start from a drawn initial state:
// a class added before the first paint (rAF callbacks can run before it) skips the transition entirely.
function afterFirstPaint(fn: () => void) {
  let done = false;
  let ran = false;
  const run = () => { if (!ran) { ran = true; fn(); } };
  // rAF is paused in background tabs; the timer makes sure entrances still start (and content shows).
  const go = () => { if (!done) { done = true; requestAnimationFrame(run); setTimeout(run, 120); } };
  if (performance.getEntriesByType('paint').length) return go();
  try {
    new PerformanceObserver((_, obs) => { obs.disconnect(); go(); }).observe({ type: 'paint' });
  } catch { /* PerformanceObserver unsupported */ }
  setTimeout(go, 1000); // safety net
}

if (motionOk) {
  afterFirstPaint(() => $('[data-hero]')?.classList.add('is-in'));

  // Stagger siblings that enter together.
  $$('[data-reveal]').forEach((el) => {
    const group = el.parentElement ? $$(':scope > [data-reveal]', el.parentElement) : [el];
    const idx = group.indexOf(el);
    if (idx > 0) el.style.setProperty('--delay', `${Math.min(idx, 6) * 0.07}s`);
  });
  afterFirstPaint(() => {
    inView('[data-reveal]', (el) => {
      // Read the starting style first: an element whose style was never resolved would jump to its end state.
      getComputedStyle(el).opacity;
      el.classList.add('is-in');
    }, { amount: 0.15, margin: '0px 0px -8% 0px' });
  });

  // The ring of frames widens slightly and fades as the hero scrolls away (transform/opacity only).
  const ring = $('[data-ring]');
  const hero = $('[data-hero]');
  if (ring && hero) {
    scroll((p: number) => {
      ring.style.transform = `scale(${(1 + p * 0.12).toFixed(3)})`;
      ring.style.opacity = String(1 - p * 0.6);
    }, { target: hero, offset: ['start start', 'end start'] });
  }
}

/* Reel: a silent loop of the live sites; plays only while visible and only if motion is welcome -------- */
const reelVideo = $<HTMLVideoElement>('[data-reel-video]');
if (reelVideo) {
  let userPaused = false;
  if (motionOk) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !userPaused) reelVideo.play().catch((err) => { if (err.name === 'NotAllowedError') reelVideo.controls = true; });
      else reelVideo.pause();
    }, { threshold: 0.25 }).observe(reelVideo);
    const toggle = $<HTMLButtonElement>('[data-reel-toggle]');
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', () => {
        userPaused = !userPaused;
        if (userPaused) reelVideo.pause(); else reelVideo.play().catch(() => {});
        toggle.textContent = (userPaused ? toggle.dataset.play : toggle.dataset.pause) ?? '';
      });
    }
  } else {
    reelVideo.controls = true; // reduced motion: the visitor decides whether it plays
  }
}

/* Hero ring: pointing at (or focusing) a frame lights it and names the project ------ */
const ringEl = $('[data-ring]');
const heroLead = $('[data-hero-lead]');
if (ringEl && heroLead) {
  const items = $$('.ring__item', ringEl);
  afterFirstPaint(() => setTimeout(() => ringEl.classList.add('is-settled'), 1400));
  const reset = () => {
    ringEl.classList.remove('is-pointing');
    items.forEach((it) => it.classList.remove('is-current'));
    heroLead.textContent = heroLead.dataset.default ?? '';
  };
  const point = (item: HTMLElement) => {
    const link = $<HTMLAnchorElement>('a', item)!;
    ringEl.classList.add('is-pointing');
    items.forEach((it) => it.classList.toggle('is-current', it === item));
    heroLead.textContent = `${link.dataset.name} · ${link.dataset.when}`;
  };
  items.forEach((item) => {
    item.addEventListener('pointerenter', () => point(item));
    item.addEventListener('focusin', () => point(item));
    item.addEventListener('pointerleave', reset);
  });
  window.addEventListener('pageshow', reset); // a back/forward return must not restore a highlight
  ringEl.addEventListener('focusout', (e) => { if (!ringEl.contains(e.relatedTarget as Node)) reset(); });
}

/* Project strips: buttons for mouse users, who have no easy way to scroll sideways -------- */
$$('.strip-wrap').forEach((wrap) => {
  const strip = $('[data-strip]', wrap)!;
  const nav = $('[data-strip-nav]', wrap)!;
  const prev = $<HTMLButtonElement>('[data-strip-prev]', wrap)!;
  const next = $<HTMLButtonElement>('[data-strip-next]', wrap)!;
  nav.hidden = false;
  const sync = () => {
    const max = strip.scrollWidth - strip.clientWidth;
    prev.disabled = strip.scrollLeft <= 2;
    next.disabled = strip.scrollLeft >= max - 2;
  };
  const go = (dir: number) => {
    const w = (strip.firstElementChild as HTMLElement).getBoundingClientRect().width + 20;
    strip.scrollBy({ left: dir * w, behavior: motionOk ? 'smooth' : 'auto' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  strip.addEventListener('scroll', sync, { passive: true });
  sync();
});

/* Contact strip: pause control for the drifting screenshots (WCAG 2.2.2) ------------------- */
const driftToggle = $<HTMLButtonElement>('[data-drift-toggle]');
if (driftToggle && motionOk) {
  driftToggle.hidden = false;
  driftToggle.addEventListener('click', () => {
    const paused = root.classList.toggle('drift-paused');
    driftToggle.textContent = (paused ? driftToggle.dataset.play : driftToggle.dataset.pause) ?? '';
  });
}

/* Process: a row of moments scrolled by swipe or the two buttons; the bar shows how far -------- */
const moments = $('[data-moments]');
if (moments) {
  const bar = $('[data-moments-bar]');
  const btns = $('[data-moments-btns]');
  const prev = $<HTMLButtonElement>('[data-moments-prev]');
  const next = $<HTMLButtonElement>('[data-moments-next]');
  if (btns) btns.hidden = false;
  const update = () => {
    const max = moments.scrollWidth - moments.clientWidth;
    const p = max > 0 ? moments.scrollLeft / max : 1;
    const seen = moments.clientWidth / moments.scrollWidth;
    bar?.style.setProperty('--p', Math.min(1, seen + p * (1 - seen)).toFixed(3));
    if (prev) prev.disabled = moments.scrollLeft <= 2;
    if (next) next.disabled = moments.scrollLeft >= max - 2;
  };
  const step = (dir: number) => {
    const first = moments.firstElementChild as HTMLElement | null;
    const w = first ? first.getBoundingClientRect().width + 32 : 300;
    moments.scrollBy({ left: dir * w, behavior: motionOk ? 'smooth' : 'auto' });
  };
  prev?.addEventListener('click', () => step(-1));
  next?.addEventListener('click', () => step(1));
  moments.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* Contact configurator: business + need → closest real project and a ready WhatsApp message -------- */
const config = $('[data-config]');
if (config) {
  const business = $<HTMLSelectElement>('[data-config-business]', config)!;
  const need = $<HTMLSelectElement>('[data-config-need]', config)!;
  const go = $<HTMLAnchorElement>('[data-config-go]', config)!;
  const closest = $$<HTMLAnchorElement>('[data-closest]');
  const sync = () => {
    const opt = business.selectedOptions[0];
    // Only the first letter goes lowercase, so "WhatsApp" keeps its capitals inside the sentence.
    const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
    const msg = (config.dataset.template ?? '')
      .replace('{b}', lower(opt.textContent!.trim()))
      .replace('{n}', lower(need.selectedOptions[0].textContent!.trim()));
    go.href = `https://wa.me/${config.dataset.wa}?text=${encodeURIComponent(msg)}`;
    closest.forEach((a) => { a.hidden = a.dataset.closest !== opt.dataset.project; });
  };
  business.addEventListener('change', () => { sync(); track('configurator_business', { business: business.value }); });
  need.addEventListener('change', sync);
  sync();
}

/* Copy email -------------------------------------------------------------- */
$$<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  if (!navigator.clipboard) return;
  btn.hidden = false;
  const label = $('[data-copy-label]', btn);
  const original = label?.textContent ?? '';
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy!);
      if (label) label.textContent = btn.dataset.copied!;
      track('contact_email_copy');
      setTimeout(() => { if (label) label.textContent = original; }, 2000);
    } catch { /* clipboard blocked: the mailto link is still there */ }
  });
});

/* Contact form: validation + real submission to Web3Forms ----------------- */
const form = $<HTMLFormElement>('[data-contact-form]');
if (form) {
  const status = $('[data-form-status]', form)!;
  const success = $('[data-form-success]', form)!;
  const submit = $<HTMLButtonElement>('button[type="submit"]', form)!;
  const submitLabel = $('[data-submit-label]', submit)!;
  const idleLabel = submitLabel.textContent;

  const rules: Record<string, (v: string) => boolean> = {
    nombre: (v) => v.trim().length >= 2,
    contacto: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || v.replace(/\D/g, '').length >= 8,
    mensaje: (v) => v.trim().length >= 10,
  };
  const validate = (field: HTMLInputElement | HTMLTextAreaElement) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const ok = rule(field.value);
    field.setAttribute('aria-invalid', String(!ok));
    const err = document.getElementById(`${field.id}-err`);
    if (err) err.textContent = ok ? '' : field.dataset.error ?? '';
    return ok;
  };
  const fields = $$<HTMLInputElement | HTMLTextAreaElement>('input[name], textarea[name]', form).filter((f) => rules[f.name]);
  fields.forEach((f) => f.addEventListener('blur', () => f.value && validate(f)));
  fields.forEach((f) => f.addEventListener('input', () => f.getAttribute('aria-invalid') === 'true' && validate(f)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const invalid = fields.filter((f) => !validate(f));
    if (invalid.length) { invalid[0].focus(); return; }

    submit.disabled = true;
    submitLabel.textContent = form.dataset.sending ?? '…';
    try {
      const data = new FormData(form);
      data.delete('redirect'); // only used by the no-JS fallback
      const contactValue = String(data.get('contacto') ?? '').trim();
      if (contactValue.includes('@')) data.set('email', contactValue); // lets you reply straight from your inbox
      const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success !== true) throw new Error(String(res.status));
      track('form_submit_success', { type: (form.elements.namedItem('tipo') as HTMLSelectElement).value });
      form.reset();
      $$('.field, .submit, .form__title', form).forEach((el) => { (el as HTMLElement).hidden = true; });
      success.hidden = false;
      success.focus();
    } catch {
      status.textContent = form.dataset.errNetwork ?? '';
      track('form_submit_error');
    } finally {
      submit.disabled = false;
      submitLabel.textContent = idleLabel;
    }
  });
}

/* Analytics: any element with data-track sends an event on click --------- */
document.addEventListener('click', (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-track]');
  if (!el) return;
  const props: Record<string, string> = {};
  if (el.dataset.trackWhere) props.where = el.dataset.trackWhere;
  if (el.dataset.project) props.project = el.dataset.project;
  props.lang = root.dataset.lang ?? '';
  track(el.dataset.track!, props);
});

/* Keep the footer year current even on an old build ----------------------- */
$$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
