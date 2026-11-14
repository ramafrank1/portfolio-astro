# Google Business Profile: guía y textos listos

El perfil lo creás vos con tu cuenta de Google: pide verificar tu identidad y tu negocio. Acá está todo preparado para que lo cargues en unos 15 minutos.

Reglas tomadas de la ayuda oficial de Google (noviembre de 2026):
[lineamientos](https://support.google.com/business/answer/3038177),
[áreas de servicio](https://support.google.com/business/answer/9157481),
[verificación](https://support.google.com/business/answer/7107242).

## Antes de empezar: ¿sos elegible?

Google da perfil a negocios con un local que los clientes visitan, o que **"travels to customers where they are"**: que van adonde está el cliente. Un negocio solo online queda afuera por esa definición.

**Te corresponde si realmente vas a ver clientes a su negocio** (relevamiento, entrega, capacitación), como un negocio de "área de servicio". Si un día dejás de hacerlo, el perfil deja de corresponder. No uses una oficina virtual ni una dirección inventada: es causa de suspensión.

## Datos para cargar

| Campo | Qué poner | Por qué |
|---|---|---|
| **Nombre** | `Ramiro Frank` | Tiene que ser tu nombre real. "Ramiro Frank Desarrollo Web Buenos Aires" está prohibido: Google no permite agregar servicios ni ubicación al nombre. |
| **Categoría principal** | `Diseñador de páginas web` (o la más cercana que ofrezca el buscador) | Google pide la que completa "este negocio ES un…" y usar la menor cantidad posible. |
| **Categoría secundaria** | `Desarrollador de software`, si aparece | Cubre los sistemas de gestión. Con una o dos alcanza. |
| **¿Tenés un local que los clientes visitan?** | **No** | Tu casa no atiende público. Tu dirección queda oculta. |
| **Área de servicio** | Ver abajo | Máximo 20 zonas; sin radio; a no más de unas 2 horas de manejo. |
| **Teléfono** | `+54 9 11 5106-0179` | Tiene que estar bajo tu control. **Se vuelve público.** |
| **Sitio web** | `https://ramirofrank.pages.dev` | Cambialo cuando tengas dominio propio. |
| **Horario** | El que realmente atendés | Si no lo cumplís, mejor no publicarlo. |

### Área de servicio (a confirmar por vos)

Propuesta a partir de donde ya tenés clientes y proyectos. Dejá solo los lugares a los que realmente vas:

San Miguel, Bella Vista, Muñiz, José C. Paz, Moreno, Hurlingham, Ituzaingó, Morón, Tortuguitas, Pilar.

### Descripción (copiar y pegar)

Sin links, precios ni promociones, que Google no permite. Tiene 591 caracteres; el límite que suele mostrar el formulario es de 750.

> Desarrollo sitios web, catálogos con pedidos por WhatsApp y sistemas de gestión a medida para comercios y negocios. Antes de programar administré comercios: un almacén en Bella Vista y la operación de un gimnasio. Por eso trabajo pensando en el día a día del negocio: que la gente te encuentre, entienda lo que ofrecés y te escriba, y que vos puedas ordenar ventas, stock, pagos o turnos. Hice el sitio de un centro de salud mental en San Miguel y el sitio y sistema de un gimnasio en Moreno. Presupuesto por escrito, avances que podés probar desde el celular y atención en español e inglés.

### Servicios

Cargalos sin precio; el precio se define por presupuesto.

| Servicio | Descripción |
|---|---|
| Sitios web para negocios | Sitio rápido y claro que explica lo que ofrecés, aparece en Google y convierte visitas en consultas por WhatsApp. |
| Sistemas de gestión a medida | Ventas, stock, socios, pagos o turnos en un sistema hecho para cómo trabaja tu negocio. |
| Catálogos con pedidos por WhatsApp | Tus clientes arman el pedido en el catálogo y te llega completo por WhatsApp. |
| Landing pages | Una página para un producto, servicio o campaña. |
| Sitios institucionales | Tu empresa o estudio, presentado con contacto directo. |
| Mantenimiento y mejoras | Velocidad, celular, Google o funciones nuevas en tu sitio actual. |

### Fotos

- **Logo:** `public/icon-512.png`.
- **Foto de perfil:** tu foto actual es de baja calidad (274×260 px). Conviene sacarte una nueva con buena luz.
- **Trabajos:** capturas de `src/assets/shots/`, sobre todo `samary-home-desktop.png` y `armagedon-home-desktop.png`.
- Google prioriza fotos reales del negocio. Una foto tuya trabajando o en una reunión con un cliente (con su permiso) suma más que una captura.

## Paso a paso

1. Entrá a [google.com/business](https://www.google.com/business/) con la cuenta que vayas a usar para el negocio.
2. Elegí **Agregar tu negocio** y cargá nombre y categoría.
3. Cuando pregunte si los clientes pueden visitar un local: **No**. Después cargá el área de servicio.
4. Cargá teléfono y sitio web.
5. **Verificación.** Google elige el método y no se puede cambiar: teléfono o SMS, correo, videollamada en vivo, video grabado o postal.
   - Si pide video, tené a mano algo que muestre que el negocio es real: tu sitio publicado, un cliente visitado, tu herramienta de trabajo. Como no tenés local, no te van a pedir un cartel, pero no pidas que te lo excusen de antemano: mostrá lo que tengas.
   - Si llega por postal (hasta 14 días, código que vence a los 30), **no edites nombre, dirección ni categoría hasta recibirla**.
   - La revisión puede tardar hasta 5 días hábiles.
6. Ya verificado, completá descripción, servicios, horario y fotos.

## Después de publicarlo

1. **Pedile reseña a tus dos clientes reales** (Samary y Armagedon). Es lo que más pesa al principio. Mensaje sugerido:

   > Hola [nombre], ¿cómo va todo? Estoy armando mi perfil profesional en Google. ¿Me dejarías una reseña contando cómo fue trabajar juntos? Te dejo el link: [link de reseña]. ¡Gracias!

   No ofrezcas nada a cambio ni te dejes reseñas vos mismo o tus conocidos: las reglas de Google prohíben las reseñas falsas o incentivadas. (Confirmá el detalle en [la política de contenido](https://support.google.com/contributionpolicy/answer/7400114); no pude leer esa sección completa.)
2. **Mismos datos en todos lados:** nombre, teléfono y sitio iguales en el perfil, el portfolio, LinkedIn e Instagram.
3. **Search Console:** registrá el sitio en [Google Search Console](https://search.google.com/search-console) y enviá `https://ramirofrank.pages.dev/sitemap-index.xml`. Es otra herramienta, y es la que hace que Google indexe el portfolio.
4. **Dominio propio:** `ramirofrank.pages.dev` funciona, pero un dominio propio da más confianza y te permite un correo profesional. Si lo comprás, actualizá el perfil y los pasos del README.
