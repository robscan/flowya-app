# Bitácora 036 — Reestructuración de bitácora (Scope bitacora-restructure-v1)

**Declaración de cierre**

- **Estado:** CERRADO
- **Rama:** scope/bitacora-restructure-v1
- **Tipo:** Scope estructural / documental
- **Impacto:** Solo `docs/bitacora` (sin código de producto)

---

## Objetivo del scope

Reestructurar la carpeta de bitácora para alinearla con las reglas de gobierno de `SCOPE_0`, preservando toda la historia existente y haciéndola más fácil de navegar.

## Cambios realizados

- **Estructura de carpetas**
  - Creada la estructura `docs/bitacora/2026/01/`.
  - `docs/bitacora/README.md` se mantiene en la raíz de `bitacora/` como documento canónico.

- **Movimiento y renombrado de entradas existentes**
  - Todas las entradas históricas de bitácora se movieron desde `bitacora/` (raíz previa) a `docs/bitacora/2026/01/`.
  - Se normalizaron los nombres a la convención `NNN-descripcion-corta.md`, manteniendo el número histórico (ej.: `001-supabase-client.md`, `020-confirm-modal-logout.md`, `035-version-freeze-v0-34.md`).
  - Se sustituyeron guiones bajos y otros símbolos por *kebab-case* en la parte descriptiva, respetando el significado original basado en el contenido de cada entrada.

- **Actualización de referencias internas**
  - Dentro de las propias entradas se actualizaron referencias que usaban rutas antiguas (`bitacora/0xx_...md`) para que apunten a la nueva estructura (p. ej. 017↔018, 020↔021, 023 y otras relacionadas). No se modificó el contenido narrativo, solo las rutas técnicas en tablas o código.

- **README canónico de bitácora**
  - `docs/bitacora/README.md` se reescribió para: definir qué es y qué no es la bitácora; explicar la relación con `docs/governance/SCOPE_0.md`; documentar la estructura `docs/bitacora/YYYY/MM/NNN-descripcion-corta.md`; y establecer pautas para nuevas entradas (contenido mínimo, trazabilidad, nota de rollback).

## Criterios de cierre cumplidos

- [x] Bitácora organizada bajo `docs/bitacora/YYYY/MM/NNN-descripcion-corta.md`.
- [x] Todo el contenido histórico preservado (solo movido y renombrado).
- [x] `docs/bitacora/README.md` definido como documento canónico, alineado con `docs/governance/SCOPE_0.md`.
- [x] No se modificó código de producto ni reglas de gobierno.
- [x] Scope reversible mediante rollback de la rama.

## Nota de rollback

Si fuese necesario revertir este scope:

- Revertir la rama `scope/bitacora-restructure-v1` (p. ej. `git revert` del merge o eliminar la rama antes de mergear).
- Se restaura la estructura anterior (`bitacora/` en raíz) y los nombres originales de los archivos.
- No hay efectos sobre base de datos ni sobre código de producto; el rollback es puramente documental.
