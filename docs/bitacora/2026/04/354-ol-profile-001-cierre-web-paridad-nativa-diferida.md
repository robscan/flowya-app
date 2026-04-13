# 354 — Cierre OL-PROFILE-001 (cuenta web; paridad nativa diferida)

**Fecha:** 2026-04-12  
**Tipo:** Cierre de loop — perfil / identidad

**Merge GitHub:** [#142](https://github.com/robscan/flowya-app/pull/142) — feat(profile): tabla `profiles`, RLS, cuenta web, Storage, cierre OL. Trazabilidad índice: [`355`](355-indice-trazabilidad-pr-141-142-2026-04.md).

## Resumen

Se cierra **`OL-PROFILE-001`** en su **alcance web-first (mobile-first de producto):** fuente de verdad `public.profiles`, superficie **`/account`** (web), avatar vía **Storage** (`profile-avatars`, `avatar_storage_path`), **email** sincronizado con `auth.users`, columna **`last_activity_at`** persistida para uso analítico (**OL-METRICS-001**; sin mostrar en UI de cuenta — ver [`356`](356-last-activity-no-ui-cuenta-ol-metrics-001-2026-04.md)), integración en **Explorar** (botón perfil, filtros, modal transparente en desktop). Evidencia de esquema y políticas Storage en repo: `scripts/supabase/snapshots/`.

**Paridad iOS/Android** (`app/account/index.tsx` y mismas capacidades que en web): **fuera de alcance** en este cierre — mismo criterio que **`OL-CONTENT-002`** (galería web primero; nativo en cola cuando producto lo priorice).

| Artefacto | Ruta / notas |
|-----------|----------------|
| Plan | [`PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md`](../../ops/plans/PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md) |
| Contrato perfil + auth | [`PROFILE_AUTH_CONTRACT_CURRENT.md`](../../contracts/PROFILE_AUTH_CONTRACT_CURRENT.md) |
| Migraciones | `026` … `029` en `supabase/migrations/` |
| Capa app | `lib/profile`, `lib/profile-avatar-upload`, `app/account/index.web.tsx` |
| Snapshots validados | `scripts/supabase/snapshots/profiles-remote.schema.json`, `storage-profile-avatars.policies.json` |

## Criterio de cierre (plan)

1. Fuente de verdad de perfil en DB — **sí** (tabla + RLS owner-only; remoto validado).  
2. Ver y editar datos básicos en **web** — **sí**.  
3. Perfil deja de ser solo chip/logout — **sí** (cuenta completa + avatar en mapa cuando aplica).  
4. Base para auth social después — **sí** (modelo estable).

## Loop ejecutivo siguiente

Según [`OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md): **`OL-CONTENT-001`** (Recordar-lite / nota privada desde SpotSheet) — **priorizable** como único loop activo; sin abrir otro en paralelo.

## Referencia

- Esta bitácora: `docs/bitacora/2026/04/354-ol-profile-001-cierre-web-paridad-nativa-diferida.md`
- Ajuste post-merge (visibilidad `last_activity_at` / OL-METRICS): [`356`](356-last-activity-no-ui-cuenta-ol-metrics-001-2026-04.md)
