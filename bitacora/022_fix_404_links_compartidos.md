# Bitácora 022 — Fix 404 en links compartidos de spots

## Problema

Al compartir un spot y pegar el link (ej. `https://flowya.app/spot/d5199b94-447f-4763-b49d-3dd577552078`) en el navegador, aparecía **404 NOT_FOUND**.

## Causa

Con `web.output: "static"`, Expo genera HTML por ruta. Las rutas dinámicas (`/spot/[id]`) no generan archivos para IDs arbitrarios sin `generateStaticParams`. Además, la URL `/spot/xxx` (sin .html) no siempre coincide con `spot/xxx.html` según la configuración del hosting.

## Solución

### 1) generateStaticParams

- **app/spot/[id].web.tsx** — Añadida función que obtiene todos los IDs de spots desde Supabase en build time.
- Genera `spot/xxx.html` para cada spot existente en la base de datos.
- Spots nuevos creados después del deploy requerirán fallback (ver 2).

### 2) Fallback para hosting (SPA-style)

- **vercel.json** — Rewrite `/spot/:path*` → `/index.html` para Vercel.
- **public/_redirects** — Regla `/spot/*  /index.html  200` para Netlify y Cloudflare Pages.
- Cuando no hay archivo estático, se sirve `index.html` y el router cliente maneja la ruta.

### 3) Flujo resultante

- **Spots existentes en build**: Se genera HTML estático; el hosting puede servirlo si la URL coincide.
- **Spots nuevos o URL sin extensión**: El rewrite/redirect sirve `index.html`; la app carga y el router muestra el detalle del spot (datos desde Supabase).

## Archivos tocados (022)

| Archivo | Cambio |
|--------|--------|
| app/spot/[id].web.tsx | generateStaticParams |
| vercel.json | Nuevo: rewrites para /spot/* |
| public/_redirects | Nuevo: fallback Netlify/Cloudflare |
| bitacora/022_fix_404_links_compartidos.md | Esta bitácora |

## Requisito de deploy

Las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` deben estar configuradas en el entorno de build para que `generateStaticParams` pueda consultar los spots.

## Criterio de cierre

- [x] Links compartidos a spots abren correctamente (sin 404)
- [x] Spots existentes en build: HTML pre-generado
- [x] Spots nuevos: fallback vía index.html
