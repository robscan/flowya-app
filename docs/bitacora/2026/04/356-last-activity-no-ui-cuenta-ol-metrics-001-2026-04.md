# 356 — `last_activity_at`: sin visibilidad en cuenta; trazabilidad OL-METRICS-001

**Fecha:** 2026-04-13  
**Tipo:** Ajuste de producto / documentación (post-merge [`#142`](https://github.com/robscan/flowya-app/pull/142))

## Resumen

La columna **`public.profiles.last_activity_at`** (migración **029**) **sigue actualizándose** desde la app (`touchMyProfileLastActivity`, p. ej. Explorar y carga de `/account` con throttle). **No** se muestra el valor en la pantalla de cuenta del usuario.

El dato queda **consultable en base de datos** y se declara como **avance de alcance** hacia **OL-METRICS-001** (cohortes, retorno, actividad), no como copy de perfil.

## Cambios en repo (referencia)

| Área | Detalle |
|------|---------|
| UI | `app/account/index.web.tsx` — eliminado bloque «Última actividad» |
| `lib/profile` | Eliminado `formatProfileLastActivity` (solo servía a esa UI); comentario en tipo `ProfileRow` |
| Contrato | [`PROFILE_AUTH_CONTRACT_CURRENT.md`](../../../contracts/PROFILE_AUTH_CONTRACT_CURRENT.md) |
| OL-METRICS | [`OL_METRICS_001_PROYECTO_METRICAS_TELEMETRIA.md`](../../../ops/plans/OL_METRICS_001_PROYECTO_METRICAS_TELEMETRIA.md) § 2.2; [`PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28.md`](../../../ops/plans/PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28.md) |
| Ops | [`OPEN_LOOPS.md`](../../../ops/OPEN_LOOPS.md) (proyecto **OL-METRICS-001**); [`PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md`](../../../ops/plans/PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md) |
| Scripts | [`scripts/supabase/README.md`](../../../../scripts/supabase/README.md) (nota migración 029) |

## Referencia

- Índice PR #141–#142: [`355`](355-indice-trazabilidad-pr-141-142-2026-04.md)
- Cierre OL-PROFILE-001 (contexto): [`354`](354-ol-profile-001-cierre-web-paridad-nativa-diferida.md)
