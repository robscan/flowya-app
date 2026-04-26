# 378 — Share preview público + anti-duplicado exacto + hardening de build

**Fecha:** 2026-04-26  
**Estado:** validado en worktree local (sin abrir OL nuevo)

## 1) Motivo

Se ejecuta un bloque auxiliar de estabilidad y corrección tras la revisión reciente, sin sustituir el loop activo `OL-CONTENT-001`.

Objetivos del bloque:

1. cerrar los hallazgos de revisión en share público y anti-duplicado;
2. reducir fragilidad operativa de `expo export` / Vercel cuando módulos cliente importan Supabase antes de tener env cargado;
3. dejar trazabilidad clara para trabajo concurrente desde Codex y Cursor.

## 2) Hallazgos y ajustes ejecutados

### 2.1 Share preview público

- El link compartido deja de depender de `/spot/:id?open=map` como shell cliente.
- La ruta pública de share pasa a ser `/s/:id`.
- En Vercel, `/s/:id` se reescribe a `api/spot-share.ts`, que devuelve HTML con metadata OG/Twitter y redirección humana al mapa.
- En hosts estáticos sin función server-side, `/s/:id` cae en la SPA (`app/s/[id].tsx`) y redirige al mapa sin romper navegación.
- `app/spot/[id].web.tsx` conserva únicamente compatibilidad legacy para links previos.
- Se elimina la dependencia de `generateStaticParams` sobre toda la tabla `spots`.

### 2.2 Anti-duplicado

- La validación dura vuelve a ser estricta:
  - título normalizado exacto dentro del radio, o
  - dirección normalizada exacta dentro del radio.
- Se elimina el bloqueo por substring (`includes`) para no rechazar spots legítimos como variantes vecinas de nombre.
- Los spots cercanos siguen mostrándose como contexto visual, pero no cuentan como duplicado duro por nombre parcial.

### 2.3 Hardening de build / deploy

- `lib/supabase.ts` deja de crear el cliente en import eager.
- Se conserva el contrato de uso `import { supabase } from '@/lib/supabase'`.
- El cliente ahora se inicializa de forma lazy al primer acceso real, mediante proxy.
- Resultado: `npm run build` vuelve a pasar incluso sin haber exportado manualmente `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` al shell antes del import.
- Esto reduce riesgo de fallos falsos en CI/build estático y evita acoplar el render estático a la presencia inmediata del env.

## 3) Decisiones de arquitectura

1. **No se cambia el contrato runtime del cliente web.**  
   `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` siguen siendo la configuración del cliente browser.

2. **No se introduce secreto nuevo en cliente.**  
   Este bloque no mueve `service_role`, tokens privados ni claves sensibles al bundle.

3. **La superficie pública de preview se desacopla del detalle SPA.**  
   `/s/:id` es la ruta pública de share; `/spot/:id?open=map` queda como compatibilidad para enlaces históricos.

4. **El hardening de Supabase se hace sin cambiar imports del repo.**  
   Esto minimiza conflicto con ramas paralelas o ediciones simultáneas desde otras herramientas.

## 4) Superficies tocadas

- `api/spot-share.ts`
- `app/s/[id].tsx`
- `app/spot/[id].web.tsx`
- `lib/explore-deeplink.ts`
- `lib/share-spot.ts`
- `lib/spot-share-preview.ts`
- `lib/spot-duplicate-check.ts`
- `lib/spot-duplicate-text.ts`
- `lib/supabase.ts`
- `vercel.json`
- `public/_redirects`
- `docs/contracts/DEEP_LINK_SPOT.md`
- `docs/contracts/ANTI_DUPLICATE_SPOT_RULES.md`
- `tests/spot-share-preview.test.mjs`
- `tests/spot-duplicate-check.test.mjs`
- baseline previo de typecheck web:
  - `constants/theme.ts`
  - `app/design-system.web.tsx`
  - `components/search/SearchOverlayWeb.tsx`
  - `components/ui/system-status-bar.tsx`
  - `components/design-system/explore-country-filter-chip-row.tsx`
  - `components/design-system/explore-tag-filter-chip-row.tsx`
  - `components/explorar/explore-places-active-filters-bar.tsx`

## 5) Validación ejecutada

1. `npm run typecheck`
2. `npm run test:regression`
3. `npm run build`
4. `eslint` focal sobre archivos tocados

Resultado: todas las validaciones anteriores pasaron en este worktree.

## 6) Guardrails para trabajo concurrente (Codex / Cursor)

1. **No sustituir `lib/supabase.ts` por clientes ad hoc por módulo.**  
   Mantener el import canónico `import { supabase } from '@/lib/supabase'`.

2. **No reintroducir `createClient(...)` eager en import.**  
   Si se necesita otro acceso, reutilizar `getSupabaseClient()` o el export canónico.

3. **`/s/:id` es la ruta pública de preview.**  
   Si se toca share, no volver a depender de `/spot/:id` para bots/OG.

4. **No reactivar heurística por substring como bloqueo duro.**  
   Si producto quiere fuzzy matching, debe entrar como warning separado, no como rechazo automático.

5. **Secrets reales siguen fuera del cliente.**  
   Todo lo privilegiado debe vivir en server routes o infraestructura server-side; `EXPO_PUBLIC_*` solo para config asumida como pública del browser.

## 7) Estado operativo tras este bloque

- No se abre un loop nuevo.
- `OL-CONTENT-001` sigue siendo el loop activo único.
- Este bloque queda documentado como saneamiento/hardening auxiliar con impacto en estabilidad de build, share público y reglas de duplicado.
