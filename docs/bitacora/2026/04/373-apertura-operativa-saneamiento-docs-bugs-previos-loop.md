# 373 — Apertura operativa: saneamiento documental y bloque correctivo previo al siguiente loop

**Fecha:** 2026-04-20
**Estado:** Apertura / gate operativo

## 1) Motivo

Antes de abrir el siguiente loop de ejecución, se detectó deriva entre:

- `docs/ops/OPEN_LOOPS.md` (loop activo único vs ejecución reciente Explore/Profile/fotos),
- contratos de Explore desktop (`EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md`, `EXPLORE_SHEETS_BEHAVIOR_MATRIX.md`),
- contrato de fotos/SpotSheet (`SPOT_SHEET_CONTENT_RULES.md` vs `PHOTO_SHARING_CONSENT.md`).

Con esta entrada se registra el **saneamiento documental mínimo bloqueante** para poder corregir bugs runtime sin operar sobre estado ambiguo.

## 2) Decisión operativa

1. **No se abre loop nuevo** en 2026-04-20.
2. **`OL-CONTENT-001`** sigue como loop ejecutivo declarado en `OPEN_LOOPS`, pero la ejecución del día entra primero en **bloque correctivo P0**.
3. El bloque correctivo P0 cubre únicamente:
   - Spot visitado: mostrar fotos personales del usuario si existen; CTA solo si no existen fotos personales visibles.
   - Cuenta/perfil: refresco inmediato del nombre visible sin recarga completa.
   - Dedupe / linking: endurecer criterios POI ↔ spot para evitar duplicados evidentes.
   - Filtros de país: ausencia de país seleccionado debe equivaler a **«Todos»** en la UI de filtros.

## 3) Contratos saneados en esta apertura

- Explore desktop sidebar ahora debe contemplar también el panel embebido de cuenta (`?account=`) como superficie prioritaria del host.
- La matriz de sheets/overlays de Explore debe reconocer `accountDesktopExploreOpen` en desktop web.
- SpotSheet / CTA de fotos no puede asumir un único flujo público; la preferencia `share_photos_with_world` sigue mandando el branch público/privado.

## 4) Gate para continuar

Se puede tocar runtime solo si:

- `OPEN_LOOPS` refleja el gate del 2026-04-20,
- la familia de contratos Explore/Profile/fotos no contradice el runtime vigente,
- cada bug entra con baseline, riesgo y rollback explícitos.
