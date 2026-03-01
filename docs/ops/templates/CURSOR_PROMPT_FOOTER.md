# CURSOR_PROMPT_FOOTER — FLOWYA

## Reglas operativas (obligatorio)
- **V3 congelado:** No iterar UI V3; solo borrar o aislar. Explore V3 (Radix/shadcn) está PAUSADO.
- **Deps:** Si Radix/shadcn fue agregado solo para V3 y ya no se usa en runtime, remover de `package.json` / `package-lock.json`.
- **No refactor masivo**. Solo lo necesario para la fase actual.
- **No UI nueva** si estamos en **Fase 2** (core extraction).
- **No duplicar estado**: alinear con `docs/contracts/explore/EXPLORE_STATE.md` y `docs/contracts/shared/SEARCH_STATE.md`.
- **Search shared**: no acoplarlo a Explore.
- **No crear paja**: si agregas un helper nuevo, debe reemplazar uno viejo o justificarlo explícitamente.

## Output obligatorio de Cursor (al final)
1) **Archivos tocados** (lista)
2) **Qué cambió y por qué** (bullets cortos)
3) **Riesgos / regresiones posibles** (≤ 5)
4) **Legacy candidates** marcados para borrar en Fase 4 (lista)

## Calidad mínima
- Mantén cambios pequeños pero completos.
- Prefiere cambios “quirúrgicos” con rutas claras hacia Fase 3 y Fase 4.
