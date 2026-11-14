# Ramiro Frank — Portfolio

Sitio profesional de Ramiro Frank, desarrollador web freelance (Buenos Aires, Argentina). Bilingüe (español en `/`, inglés en `/en/`), estático y rápido. Publicado en Cloudflare Pages: https://ramirofrank.pages.dev

- **Stack:** [Astro 7](https://astro.build) (HTML estático, casi sin JavaScript) · TypeScript · CSS propio con tokens de diseño · [Motion](https://motion.dev) para animaciones.
- **Páginas:** inicio (hero, proyectos, servicios, proceso, sobre mí, contacto), un caso de estudio por proyecto, página de “gracias”, 404. Todo en los dos idiomas.
- **Calidad medida (octubre 2026, build local):** Lighthouse 100 en rendimiento, accesibilidad, buenas prácticas y SEO, en móvil y escritorio, en 4 páginas. CLS 0.

---

## Uso rápido

Requisitos: Node.js 22.12 o superior.

```bash
npm install
npm run dev        # desarrollo en http://localhost:4321
npm run build      # versión de producción en dist/
npm run preview    # sirve dist/ en http://localhost:4321
```

### Pruebas

| Comando | Qué verifica |
|---|---|
| `npm run check` | Tipos de TypeScript y plantillas Astro |
| `npm test` | Sobre `dist/`: títulos y descripciones únicos, canonical, hreflang, Open Graph, JSON-LD válido, enlaces internos e imágenes, `alt`, enlaces de WhatsApp con el número correcto, formulario de Web3Forms (si está activo), sitemap y robots, ausencia de estilos inline (CSP) |
| `npm run test:e2e` | En navegador real (con `npm run preview` corriendo; las pruebas del formulario necesitan una compilación con `PUBLIC_WEB3FORMS_KEY`): menú móvil, selector de contacto, tiras de capturas, fila del proceso, anillo del hero, proyectos fuera de línea, validación y envío del formulario (éxito y error), cambio de idioma, enlaces de proyectos, teclado, movimiento reducido, sin JavaScript, 404 |
| `npm run test:visual` | Capturas de página completa en 320, 375, 390, 430, 768, 1024, 1440 y 1920 px, detecta scroll horizontal, imágenes rotas, errores de consola y de red. Guarda en `qa-out/` |
| `npm run test:lighthouse` | Lighthouse móvil y escritorio en 4 páginas. Guarda en `lh-out/` |

---

## Publicación (Cloudflare Pages)

**Sitio publicado:** https://ramirofrank.pages.dev (proyecto `ramirofrank` en tu cuenta de Cloudflare, plan gratuito).

Se publica desde tu PC con Wrangler (la CLI de Cloudflare), sin conectar GitHub:

```bash
npm run deploy     # compila, corre las verificaciones y sube dist/ a producción
```

La primera vez, si Wrangler no tiene sesión: `npx wrangler login` (abre el navegador para autorizar). Cada publicación queda además en una URL propia (`https://<id>.ramirofrank.pages.dev`) por si querés volver atrás: en el panel de Cloudflare → **Workers & Pages → ramirofrank → Deployments** podés hacer *Rollback*.

Las cabeceras de seguridad y de caché están en `public/_headers`. La página 404 y las barras finales las resuelve Cloudflare Pages automáticamente.

### Variables

Se leen al compilar desde un archivo `.env` en la raíz (copiá `.env.example`). Nunca se sube al repositorio.

| Variable | Para qué |
|---|---|
| `SITE_URL` | Dirección pública. Por defecto `https://ramirofrank.pages.dev` (en `src/config/site-url.mjs`) |
| `PUBLIC_WEB3FORMS_KEY` | Activa el formulario de contacto (ver abajo) |
| `PUBLIC_UMAMI_WEBSITE_ID` | Activa la analítica (ver más abajo) |

### Formulario de contacto (Web3Forms)

Cloudflare Pages no tiene un servicio de formularios propio, así que el formulario usa [Web3Forms](https://web3forms.com): gratuito, cada consulta te llega por correo y la clave está pensada para usarse en el navegador (solo permite enviar a tu casilla). **Mientras no haya clave, el formulario no se muestra** y el contacto queda por WhatsApp y correo.

1. Entrá a [web3forms.com](https://web3forms.com), escribí `tu-email@ejemplo.com` y pedí la *Access Key* (llega por mail).
2. Ponela en `.env` como `PUBLIC_WEB3FORMS_KEY=...` y corré `npm run deploy`.
3. Probá el formulario en el sitio: tiene que mostrar “¡Listo! Recibí tu consulta” y te tiene que llegar el correo (si escribieron un email, podés responder directo).

El formulario valida en el navegador, tiene un campo trampa (*honeypot*) para bots y solo confirma el envío cuando Web3Forms responde que salió bien. Sin JavaScript, envía igual y redirige a `/gracias/`.

## Conectar un dominio propio

Opciones habituales: `ramirofrank.com`, `ramirofrank.dev` o `ramirofrank.com.ar` (este último se registra en [NIC Argentina](https://nic.ar)). No se compró ninguno. Cloudflare también vende dominios a precio de costo (**Domain Registration** en el panel).

1. Comprá el dominio (en Cloudflare es lo más simple; si es de otro registrador, cambiá sus DNS a los de Cloudflare).
2. En Cloudflare → **Workers & Pages → ramirofrank → Custom domains → Set up a custom domain**. El certificado HTTPS es automático.
3. Cambiá `SITE_URL` al dominio nuevo (en `.env` o en `src/config/site-url.mjs`) y corré `npm run deploy`. Esto actualiza canonical, hreflang, sitemap y Open Graph.
4. Registrá el sitio en [Google Search Console](https://search.google.com/search-console) y enviá `https://TU-DOMINIO/sitemap-index.xml`. (No se hizo: requiere tu cuenta. Hasta que lo hagas no se puede afirmar que el sitio esté indexado.)

## Analítica (opcional, sin cookies)

El sitio está preparado para [Umami Cloud](https://umami.is): plan Hobby gratuito (a octubre de 2026: 100.000 eventos por mes, 1 sitio, 6 meses de historial), sin cookies y sin banner de consentimiento.

1. Creá una cuenta en Umami Cloud y agregá tu sitio.
2. Copiá el **Website ID**, ponelo en `.env` como `PUBLIC_UMAMI_WEBSITE_ID=...` y corré `npm run deploy`.
3. Para verificar: abrí el sitio, hacé clic en “Abrir WhatsApp” y mirá en Umami → **Events** que aparezca `contact_whatsapp`.

Sin esa variable no se carga ningún script de seguimiento.

**Eventos que se registran** (definidos con `data-track` en el HTML; ver `src/scripts/analytics.ts`). Ninguno envía datos personales.

| Evento | Cuándo |
|---|---|
| (vista de página) | Automático, incluye las páginas de cada caso |
| `cta_quote` | Clic en “Pedir presupuesto” (propiedad `where`: header, hero, menu, case_cta) |
| `contact_whatsapp` | Clic en cualquier enlace de WhatsApp (`where`: contact, footer, service_*, case_cta) |
| `contact_email`, `contact_email_copy` | Clic en el correo o en “Copiar” |
| `social_linkedin`, `social_github`, `social_instagram` | Clic en redes |
| `project_open` | Apertura de un caso (`project`, `where`) |
| `project_visit` | Clic para visitar el sitio de un proyecto |
| `form_submit_success` / `form_submit_error` | Envío del formulario confirmado o fallido |
| `lang_switch` | Cambio de idioma |
| `configurator_business` | Tipo de negocio elegido en el selector de contacto |

Si preferís Google Analytics 4: el mismo `track()` envía a `gtag` si existe. Habría que agregar el script de GA4, un banner de consentimiento y su dominio a la CSP en `astro.config.mjs`.

---

## Cómo actualizar contenido

Todo el texto está separado del diseño:

| Qué | Dónde |
|---|---|
| WhatsApp, correo, LinkedIn, GitHub, Instagram, disponibilidad | `src/data/site.ts` |
| Proyectos (textos, estado, funciones, tecnologías, capturas) | `src/data/projects.ts` |
| Servicios, proceso, “sobre mí”, datos de la ficha | `src/data/content.ts` |
| Textos de la interfaz (botones, títulos, formulario) en ES/EN | `src/i18n/ui.ts` |
| Colores, tipografía y espaciados | `src/styles/global.css` (variables al principio) |

**Marcar un proyecto como terminado:** en `src/data/projects.ts`, cambiá `status` a `'live'` y actualizá `statusNote` en los dos idiomas.

**Agregar un proyecto:**
1. Agregá su URL en `scripts/capture-screens.mjs` y corré `npm run shots -- <slug>` (captura escritorio y móvil reales).
2. Importá las capturas en `src/data/projects.ts` y agregá la entrada (podés copiar una existente).
3. Completá `frames` (las capturas de escritorio de su tira), agregá una línea `[data-vt='shot-<slug>']` en `src/styles/global.css` (transición de la captura entre páginas) y el proyecto en `scripts/make-brand-assets.mjs`; después corré `npm run assets` (imagen para compartir).
4. `npm run build && npm test`.

**Actualizar capturas:** `npm run shots` (sitios publicados). Las de Paleta salen de la demo local: en `Desktop/monje/server` corré `npm run demo` y después `npm run shots:paleta`.

**Cambiar tu foto:** `node scripts/prepare-photo.mjs "ruta/a/la/foto.png"` (recorta, amplía y genera `src/assets/ramiro.png` y `ramiro-face.png`). Si la nueva tiene otro encuadre, ajustá `crop` en ese script. Con una foto de mejor calidad podés mostrarla más grande y a color: los estilos están en `src/components/About.astro` (`.portrait`) y `src/components/Header.astro` (`.brand__photo`).

**Precios:** no se publican precios; los servicios invitan a pedir presupuesto. Si querés mostrar “desde $…”, se agrega en `src/data/content.ts`.

---

## Decisiones de diseño

- **Referencia:** el estilo de teenage engineering en [Refero Styles](https://styles.refero.design/style/aecf9dda-5cba-4dc7-9e73-59b65d895cdf), un catálogo industrial. Tu trabajo es el "producto": las capturas reales son lo único rico de la página y todo lo demás acompaña. Se adaptó para que se lea bien: el texto corrido usa peso normal a 17 px, no el trazo ultrafino de 13 px del original.
- **Composición:** la dirección "contact sheet" de taste-skill: anillo de capturas en el hero, tiras de capturas por proyecto, servicios en filas, proceso en una fila horizontal, foto como letra capitular y pie de página en bloques.
- **Sistema:** fondo `#f6f8f7`, tinta negra, franjas carbón `#0f0e12`, esquinas rectas, sin sombras ni degradados. Una tipografía (Inter), cinco tamaños. El ámbar `#f0a800` se usa solo en la acción principal y en detalles de disponibilidad. Las líneas finas quedan solo en tablas reales.
- **La pieza interactiva:** en contacto elegís tu tipo de negocio y lo que necesitás; te muestra el trabajo más parecido y deja escrito el mensaje de WhatsApp. Se edita en `businessTypes` y `needs` de `src/data/content.ts`.
- **Foto:** el original es de baja resolución (274×260 px), así que se muestra chica y en blanco y negro, y pasa a color al pasar el mouse. Sin retoques en la cara.
- **Sin modo oscuro:** este estilo usa una sola superficie con franjas oscuras.

### Animaciones

| Efecto | Implementación |
|---|---|
| Título del hero que sube por línea, anillo que aparece en secuencia | CSS, activado por una clase después del primer pintado |
| Anillo que resalta el proyecto al señalarlo | Script propio + CSS |
| Anillo que se abre y se apaga al bajar | `scroll` de Motion (solo `transform` y `opacity`) |
| Entrada de las secciones | `inView` de Motion + transiciones CSS |
| Tira de capturas a la deriva en contacto | Animación CSS |
| Video de los sitios en vivo | `<video>` silencioso; se reproduce solo cuando es visible |
| Captura que "viaja" del inicio al caso | View Transitions entre páginas |

Con `prefers-reduced-motion` no hay animaciones y el video queda con controles. **En tu PC las animaciones de Windows están apagadas**, así que Chrome y Edge no las muestran: se activan en Configuración → Accesibilidad → Efectos visuales → Efectos de animación.

## Librerías y recursos

| Recurso | Uso | Licencia |
|---|---|---|
| [Astro](https://github.com/withastro/astro) 7 | Framework, generación estática, imágenes, i18n, CSP | MIT |
| [@astrojs/sitemap](https://github.com/withastro/astro/tree/main/packages/integrations/sitemap) | `sitemap-index.xml` con alternativas de idioma | MIT |
| [Motion](https://github.com/motiondivision/motion) 14 (`inView`, `scroll`) | Animaciones al hacer scroll | MIT |
| [Lucide](https://github.com/lucide-icons/lucide) (`lucide-static`) | Iconos, insertados como SVG al compilar | ISC |
| [Inter](https://github.com/rsms/inter) vía [Fontsource](https://fontsource.org) | Tipografía, alojada en el propio sitio | SIL Open Font License 1.1 |
| [sharp](https://github.com/lovell/sharp) | Optimización de imágenes (AVIF/WebP) al compilar | Apache-2.0 |
| [Playwright](https://github.com/microsoft/playwright), [Lighthouse](https://github.com/GoogleChrome/lighthouse), [Wrangler](https://github.com/cloudflare/workers-sdk) | Capturas, pruebas y publicación (solo desarrollo) | Apache-2.0 / Apache-2.0 / MIT-Apache |

**Imágenes y video:** todo es real: capturas de los sitios y, en Paleta, de su demo local con datos ficticios. El video se graba con `node scripts/record-reel.mjs`. No hay fotos de stock. Las capturas de Bulk Gym, Grasso y Forrajes son de octubre de 2026: esos sitios ya no están publicados y `npm run shots` conserva la última captura buena si un sitio da error.

## Seguridad y privacidad

- Política de seguridad de contenido (CSP) generada por Astro con *hashes* de cada script y estilo inline, más cabeceras de seguridad en `public/_headers` (`frame-ancestors`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`).
- Sin secretos en el código: las únicas variables (`SITE_URL`, `PUBLIC_UMAMI_WEBSITE_ID`) son públicas por naturaleza. `.env` está en `.gitignore`.
- El formulario pide lo mínimo (nombre, un contacto, tipo y mensaje), valida en el navegador, tiene honeypot y el filtro antispam de Web3Forms, y confirma el envío solo cuando Web3Forms responde que salió bien.
- Pasar estas pruebas no significa que el sitio sea “completamente seguro”: es un sitio estático con poca superficie de ataque, y conviene mantener las dependencias actualizadas (`npm outdated`).

## Limitaciones conocidas

- Los paneles administrativos de los proyectos se describen a partir de su código fuente, sin capturas (son privados). Si mandás capturas, se agregan a `gallery` en `src/data/projects.ts`.
- La demo de Paleta está en el plan gratuito de Render: la primera visita puede tardar hasta un minuto en despertar. El caso lo aclara.
- Las pruebas del formulario solo corren si la compilación tiene `PUBLIC_WEB3FORMS_KEY`; sin clave se omiten.

## Google Business Profile

Guía, textos y reglas en [docs/google-business-profile.md](docs/google-business-profile.md).
