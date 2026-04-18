# SYSTEM_STATUS_TOAST — Barra de estado / «toast» (canónico + Explore)

**Implementación:** `components/ui/system-status-bar.tsx`  
**API:** `useSystemStatus()` → `{ show, setAnchor, resetAnchor }`  
**Provider:** `SystemStatusProvider` en `app/_layout.tsx`

Documentación histórica de implementación base: bitácora `233` (`OL-P1-003`). **Nota:** la duración y la cola en la bitácora 233 pueden estar desactualizadas; esta sección refleja el código vigente.

---

## 1) Comportamiento general (todas las pantallas)

| Aspecto | Valor / regla |
|---------|----------------|
| Duración por defecto | `4800` ms (`SYSTEM_STATUS_DURATION_MS`) |
| Cierre manual | Tap en el toast dispara `dismiss` (fade ~180 ms) |
| Cola | Hasta **3** mensajes visibles; opción `replaceVisible` sustituye por un solo mensaje |
| Animación entrada | Opacity 0 → 1 en ~140 ms |
| Z-index | `12` en el overlay |
| `pointerEvents` | `'box-none'` en el contenedor animado para no bloquear el mapa |
| Accesibilidad | Toast envuelto en `Pressable` con hint de cierre; `accessibilityLiveRegion="polite"` |

### 1.1 Tipos de mensaje (`options.type`)

- `default` — **Paleta neutra invertida** (`resolveToastNeutralPalette`): máximo contraste respecto al tema de la app. Uso canónico para **feedback de UI** que no es guardado ni creación (p. ej. **cambio de filtro de pins** en Explore, copiar enlace, resumen al portapapeles, descarga de imagen de compartir).
  - **Dark UI** → fondo blanco semitransparente, texto negro.
  - **Light UI** → fondo oscuro semitransparente, texto blanco.
- `success` — Fondo **`Colors[state].stateSuccess`**, texto blanco, borde sutil; icono `CheckCircle2` decorativo (oculto para VoiceOver). Reservado a **persistencia exitosa** o **creación** de contenido (guardar spot/estado pin, imagen o descripción en ficha, crear o eliminar etiqueta de usuario, etc.).
- `error` — Fondo **`Colors[state].stateError`**, texto blanco, borde sutil; icono `AlertCircle` decorativo.
- **Varios mensajes visibles:** cada fila usa la paleta de **su** `type` (no se mezclan colores en un solo bloque).

**Accesibilidad:** si **algún** mensaje visible es `error`, el contenedor de mensajes usa `accessibilityLiveRegion="assertive"`; en caso contrario `polite`. El cierre sigue siendo el `Pressable` exterior.

**Replicación nativa (iOS/Android):** mismos tokens y reglas; `success`/`error` priorizan reconocimiento cromático + icono, sin sustituir el mensaje textual.

### 1.2 Opciones `show(message, options?)`

- `replaceVisible: true` — recomendado para mensajes de **filtro** o cambios rápidos donde no se deben apilar toasts.
- `durationMs` — override opcional de la duración.

---

## 2) Anclaje (`placement`)

### 2.1 Por defecto (root)

- `placement: 'top-center'`
- `top`: web **72** (`DEFAULT_TOP_WEB`), nativo **88** (`DEFAULT_TOP_NATIVE`)
- `paddingHorizontal`: `Spacing.lg`, ancho máximo ~420 en estilo `stackTopCenter`

### 2.2 Explore / mapa (`MapScreenVNext`)

El mapa llama a `toast.setAnchor` en un `useEffect` para reflejar **controles inferiores**, **sheet** y **buscador**.

| Condición | `bottom` (resumen) |
|-----------|---------------------|
| **Buscador abierto** (`searchV2.isOpen`) | **No** sumar altura del sheet: `dockBottomOffset + insets.bottom` (+ clearance FLOWYA si aplica). Evita toast «flotando» como si el sheet visible fuera el del mapa. |
| **Cualquier sheet Explore en `expanded`** (Spot/POI, países o bienvenida) | Borde inferior de pantalla: `CONTROLS_OVERLAY_BOTTOM` (20) + `insets.bottom` — **no** se suma la altura del sheet; el toast queda en la parte baja del viewport. |
| Spot/POI con sheet visible en peek o medium | `CONTROLS_OVERLAY_BOTTOM` (20) + `sheetHeight` + `STATUS_OVER_SHEET_CLEARANCE` (18) |
| Sheet de países en peek o medium | Similar con `countriesSheetHeight` |
| Resto | `dockBottomOffset` (12) + `insets.bottom` + `FLOWYA_LABEL_CLEARANCE` (60) si la etiqueta FLOWYA es visible |

**Placement:** `bottom-left` con `left: TOP_OVERLAY_INSET_X + insets.left`, `bottom` calculado como arriba.

**`right`:** si los MapControls están visibles (no búsqueda, sheet no expanded, etc.), se añade `CONTROLS_OVERLAY_RIGHT` + `STATUS_AVOID_CONTROLS_RIGHT` (64) para no solapar la columna de botones.

**Cleanup:** al cambiar dependencias o desmontar, `resetAnchor()` restaura top-center por defecto.

### 2.3 Coalescencia de `setAnchor` (2026-04)

- `setAnchor` agrupa actualizaciones en un **`requestAnimationFrame`**: varias llamadas seguidas en el mismo frame de pintura aplican solo el **último** ancla redondeada (`roundAnchorPx`), reduciendo micro-movimientos del toast cuando layout/sheet cambian en cascada.
- Sigue aplicándose `anchorsEqual` para no re-renderizar si el valor efectivo no cambia.

### 2.4 Política **sheet `expanded`** + toasts (2026-04, Explore)

**Contexto (histórico en producto):** en un momento se evitaban el toast de **cambio de filtro** y parte del feedback de **pin** cuando algún sheet (Spot, países o bienvenida) estaba en `expanded`, para reducir ruido visual.

**Regla vigente:**

1. **No** se ocultan toasts solo por tener un sheet en `expanded`. El usuario debe recibir el mismo feedback de filtro y de acciones en pin que en peek/medium.
2. **Posición:** cuando **cualquier** sheet Explore relevante está en `expanded`, el ancla usa **borde inferior del viewport** (`CONTROLS_OVERLAY_BOTTOM + insets.bottom`, sin sumar la altura del sheet). Así el mensaje sigue legible y no queda «subido» por encima de un sheet casi a pantalla completa.
3. **Excepciones puntuales (no son «expanded»):**
   - `suppressToastRef`: ref que handlers pueden poner a `true` un instante para flujos concretos; se resetea a `false` cada render en `MapScreenVNext`.
   - `handlePinFilterChange(..., { toastMessage: "" })`: suprime **solo ese** toast de filtro (p. ej. al abrir países visitados desde la pastilla, donde el sheet ya comunica el contexto). No depende del estado del sheet.

**Implementación de referencia:** `components/explorar/MapScreenVNext.tsx` — `useEffect` de `toast.setAnchor` (`anyExploreSheetExpanded`) y llamadas a `toast.show` sin ref de supresión por expanded.

### 2.5 Reset

- `resetAnchor()` → vuelve a `top-center` con `top` por plataforma.

---

## 3) Checklist para desarrollo nativo (paridad)

1. **Un solo provider** de estado global en la raíz de la app.
2. **API idéntica:** `show`, `setAnchor`, `resetAnchor`.
3. **Duración** y **replaceVisible** con la misma semántica.
4. **Explore:** al abrir búsqueda a pantalla completa, **recalcular** anclaje inferior sin altura del SpotSheet; al cerrar búsqueda, restaurar lógica con sheet.
5. **Explore + sheet `expanded`:** replicar la tabla del §2.2: con sheet expandido, **no** subir el toast sumando `sheetHeight` / `countriesSheetHeight`; anclar al **borde inferior de pantalla** (misma fórmula que web). **No** reintroducir supresión de toasts de filtro/pin solo porque el sheet esté expandido.
6. **Contraste:** `default` = paleta invertida; `success`/`error` = tokens de tema + texto blanco; texto 16/600 semibold (`numberOfLines` hasta 5 en runtime).
7. **Touch:** el toast debe ser tocable para cerrar; el contenedor no debe interceptar interacciones del mapa (`pointerEvents` acorde).
8. **Safe area:** `insets` deben incluirse en `bottom`/`left`/`right` como en web.

---

## 4) Deprecación

- `components/ui/toast.tsx` delega en `@/components/ui/system-status-bar` — no introducir nuevos usos de la API antigua.
