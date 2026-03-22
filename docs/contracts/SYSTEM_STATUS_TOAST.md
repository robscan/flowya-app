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

- `success` | `default` | `error` — **no afectan al color** en la implementación actual.
- **Paleta visual:** máximo contraste **invertido** respecto al tema de la app (`resolveToastPalette`):
  - **Dark UI** → fondo blanco semitransparente, texto negro.
  - **Light UI** → fondo oscuro semitransparente, texto blanco.
- Borde sutil: `rgba` según tema.

**Replicación nativa (iOS/Android):** misma lógica de contraste invertido; no usar colores semánticos verde/rojo para el fondo del toast salvo decisión de producto futura.

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
| Spot/POI con sheet visible (sheet no cubierto por búsqueda) | `CONTROLS_OVERLAY_BOTTOM` (20) + `sheetHeight` + `STATUS_OVER_SHEET_CLEARANCE` (18) |
| Sheet de países expandido | Similar con `countriesSheetHeight` |
| Resto | `dockBottomOffset` (12) + `insets.bottom` + `FLOWYA_LABEL_CLEARANCE` (60) si la etiqueta FLOWYA es visible |

**Placement:** `bottom-left` con `left: TOP_OVERLAY_INSET_X + insets.left`, `bottom` calculado como arriba.

**`right`:** si los MapControls están visibles (no búsqueda, sheet no expanded, etc.), se añade `CONTROLS_OVERLAY_RIGHT` + `STATUS_AVOID_CONTROLS_RIGHT` (64) para no solapar la columna de botones.

**Cleanup:** al cambiar dependencias o desmontar, `resetAnchor()` restaura top-center por defecto.

### 2.3 Reset

- `resetAnchor()` → vuelve a `top-center` con `top` por plataforma.

---

## 3) Checklist para desarrollo nativo (paridad)

1. **Un solo provider** de estado global en la raíz de la app.
2. **API idéntica:** `show`, `setAnchor`, `resetAnchor`.
3. **Duración** y **replaceVisible** con la misma semántica.
4. **Explore:** al abrir búsqueda a pantalla completa, **recalcular** anclaje inferior sin altura del SpotSheet; al cerrar búsqueda, restaurar lógica con sheet.
5. **Contraste:** paleta invertida; texto 16/600 semibold, línea ~21, máximo 2 líneas (`numberOfLines={2}`).
6. **Touch:** el toast debe ser tocable para cerrar; el contenedor no debe interceptar interacciones del mapa (`pointerEvents` acorde).
7. **Safe area:** `insets` deben incluirse en `bottom`/`left`/`right` como en web.

---

## 4) Deprecación

- `components/ui/toast.tsx` delega en `@/components/ui/system-status-bar` — no introducir nuevos usos de la API antigua.
