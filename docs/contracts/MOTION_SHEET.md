# MOTION_SHEET — Motion spec for ExploreSheet (and sheet-like UI)

**Última actualización:** 2026-02-09  
**Relacionado:** EXPLORE_SHEET.md (estados collapsed | medium | expanded)

> Especificación canónica de duraciones, easing y snap para sheets. Objetivo: motion consistente tipo Apple Maps (predecible, no “bouncy random”).

---

## 1) Principios

- **Predecible:** el usuario debe poder anticipar dónde termina el sheet tras un gesto o tap.
- **No bouncy random:** evitar springs exagerados o rebotes que distraen; transiciones claras entre estados.
- **Consistente:** mismas reglas para search y spot mode; mismo comportamiento en programático vs drag.
- **Respetar preferencias:** reduced motion debe acortar o eliminar animaciones.

---

## 2) Duraciones (ms) por transición

| Transición | Duración (ms) | Nota |
|------------|----------------|------|
| collapsed ↔ medium | 280 | Transición corta; cambio de contexto inmediato |
| medium ↔ expanded | 320 | Un poco más larga para dar sensación de “apertura” |
| Programmatic open/close | 300 | Cualquier cambio de estado vía código (tap, botón, evento mapa) |

- Todas las duraciones son **máximo**; la implementación puede usar menos si el desplazamiento es pequeño.
- Con **reduced motion** activo (ver más abajo), estas duraciones se anulan o se reducen a mínimo.

---

## 3) Easing canónico

- **Nombre canónico:** `ease-in-out` (acelerar al inicio, desacelerar al final).
- **CSS equivalente:** `cubic-bezier(0.4, 0, 0.2, 1)` o `ease-in-out`.
- **React Native / Reanimated:** `Easing.inOut(Easing.ease)` o curva equivalente a `(0.4, 0, 0.2, 1)`.
- No usar `ease-out` puro para “abrir” y otro para “cerrar” de forma asimétrica salvo decisión explícita de diseño; mantener simetría para que open/close se sientan coherentes.

---

## 4) Drag snapping

### Threshold para snap

- **Por posición:** si el usuario suelta el sheet habiendo recorrido **≥ 25%** del camino hacia el siguiente estado (collapsed → medium, medium → expanded, etc.), snap a ese siguiente estado; si &lt; 25%, snap al estado anterior.
- **Alternativa en px:** si se prefiere fijo, usar un umbral de **~80px** desde el borde del estado actual hacia el siguiente (ajustar por densidad si aplica).
- Definir en implementación si se usa % o px y documentar en el componente.

### Regla por velocity

- Si **velocity Y** (al soltar) indica dirección clara hacia el siguiente estado (p. ej. velocity &lt; -threshold para “subir” el sheet), snap al estado en esa dirección aunque la posición no haya llegado al 25%.
- Umbral de velocity sugerido: valor que en ~100–150 ms llevaría el sheet más allá del 25% del recorrido (depende del damping; típicamente 0.3–0.5 en unidades normalizadas o equivalente en px/s).
- No usar velocity para “saltar” más de un estado (collapsed → expanded en un solo gesto solo si el diseño lo define; por defecto, snap al estado adyacente).

---

## 5) Reduced motion

- Si el usuario tiene **preferencia de reduced motion** activa (`prefers-reduced-motion: reduce` en CSS / equivalente en RN):
  - **Opción A:** duración = 0 (cambio instantáneo de estado).
  - **Opción B:** duración mínima (p. ej. 80–100 ms) para evitar flash brusco pero sin animación notable.
- La especificación recomienda **Opción A** por defecto; la implementación debe leer la preferencia del sistema y aplicar una de las dos de forma consistente.

---

## 6) Guardrails

- **Preferir `translateY` sobre animar `height`:** animar la posición del sheet (transform) es más eficiente y evita layout thrashing; la altura “lógica” puede ser fija por estado y el contenido se recorta o hace scroll dentro. Si la plataforma obliga a animar height, documentar y aceptar el coste.
- **Keyboard-safe:** no animar de forma agresiva contra el teclado. Al abrir teclado, ajustar el sheet (posición o insets) sin animaciones largas que compitan con el movimiento del teclado; preferir que el sheet se acomode al teclado en la misma duración que el teclado (o menos). No usar springs fuertes que “peguen” el sheet contra el teclado.
- **Un solo driver:** si el sheet está siendo arrastrado, no inyectar animación programática simultánea que compita; esperar a que el gesto termine y luego aplicar snap con la duración/easing definidos.

---

## 7) Resumen por implementación

- Duraciones: 280 ms (collapsed↔medium), 320 ms (medium↔expanded), 300 ms (programático).
- Easing: ease-in-out / cubic-bezier(0.4, 0, 0.2, 1).
- Snap: ≥25% recorrido o velocity clara → siguiente estado; si no, estado actual.
- Reduced motion: duración 0 o ≤100 ms.
- Guardrails: translateY preferido; keyboard-safe; un solo driver por transición.

---

## 8) SearchSheet (2-state)

SearchSheet (SearchFloating) tiene solo **closed** y **open_full**. No hay estados intermedios (collapsed/medium).

### Duraciones open/close

- **Abrir:** translateY de `screenHeight` → `0`: **300 ms**, easing canónico (cubic-bezier 0.4, 0, 0.2, 1).
- **Cerrar (programático o drag-to-dismiss):** translateY de `0` → `screenHeight`: **300 ms** (programático) o **280 ms** (al soltar tras drag), mismo easing.

### Threshold drag-to-dismiss

- **Por posición:** si el usuario suelta habiendo arrastrado **≥ 25%** del alto de pantalla hacia abajo → cerrar; si no → snap back a abierto (translateY = 0).
- **Por velocity:** si **velocityY > 800** (px/s) hacia abajo al soltar → cerrar aunque la posición no llegue al 25%.

### Reduced motion

- Si `prefers-reduced-motion`: duración 0 o mínima (misma regla que §5).
