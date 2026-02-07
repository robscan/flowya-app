# Bitácora 036 (2026/02) — Fix: FAB Search/X activo (azul) cuando Search abierto

**Problema:** Al abrir Search, el FAB mostraba ícono X pero con estilo negro/inactivo.

**Fix:** Cuando `searchOverlayVisible` es true, el FAB de cierre usa:
- `backgroundColor: colors.primary` (azul, theme-aware)
- Ícono X en blanco (`#fff`) para contraste
- Estado pressed: `opacity: 0.85` (sin cambiar a negro)

**Archivo:** `app/(tabs)/index.web.tsx` — estilos del FAB en `fabWrap` / `fabSearchClose`.

**QA:** Abrir search → FAB azul con X blanco; cerrar → FAB vuelve al estilo normal (IconButton con lupa). Light/dark: contraste correcto.
