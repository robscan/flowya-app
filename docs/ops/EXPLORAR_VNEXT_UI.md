# EXPLORAR_VNEXT_UI — Spec rápido (source of truth)

**Última actualización:** 2026-02-09

---

## Top bar (tipo Apple Maps)

- Search input + botón cerrar en **una sola línea**.
- Clear “x” dentro del input cuando hay texto.
- Focus state: **fondo del contenedor** (no línea azul visible).
- Botón de perfil **al lado del buscador** (no dentro de chips).
- Logout: cuando se despliega, lo hace **arriba** (no en bottom).

---

## Search behavior

- Search **NO** es overlay si rompe scroll/drag o crea “espacio blanco”.
- Con teclado abierto: lista visible se ajusta (safe-area + keyboard) y no tapa cards.

---

## ExploreSheet (único)

- 3 estados: `collapsed / medium / expanded`
- Un solo componente sheet con `mode`:
  - `mode="search"`: contenido de búsqueda
  - `mode="spot"`: contenido de spot

- `collapsed` (spot): header flotante ancho completo (share + título + cerrar).
- `medium/expanded`: altura ajustable + scroll sin romper layout.
- Al pan/zoom del mapa: colapsa a header cuando `mode="spot"`.
- Animaciones/drag: “safe by default” (sin regresiones).

---

## Filtros

- Chips con border radius consistente con design system.
- Estados definidos por tokens (active/inactive/pressed/disabled).
