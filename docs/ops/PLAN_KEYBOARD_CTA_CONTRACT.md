# Plan: Aplicar contrato KEYBOARD_AND_TEXT_INPUTS

**Objetivo:** Implementar las reglas del contrato `KEYBOARD_AND_TEXT_INPUTS.md` en toda la app.

**Referencia:** `docs/contracts/KEYBOARD_AND_TEXT_INPUTS.md`

---

## Resumen de reglas a aplicar

| Regla | Descripción |
|-------|-------------|
| T1 | Campo de texto enfocado → teclado visible. |
| T2 | Contenido keyboard-safe. |
| C1 | CTA sticky sobre el teclado; nunca oculto. |
| C2 | Con teclado cerrado, CTA en posición asignada. |
| S1 | Scroll/swipe en lista o búsqueda → teclado se cierra. |

---

## Fase 1: CTA sticky sobre teclado — CreateSpotNameOverlay

**Problema:** El botón "Continuar" tiene `bottom: 0` sin compensar `keyboardHeight`; puede quedar oculto detrás del teclado.

**Archivo:** `components/explorar/CreateSpotNameOverlay.tsx`

**Cambios:**
1. Añadir estado `keyboardHeightWeb` (web) y `keyboardHeight` (native).
2. Web: `useEffect` con `visualViewport` → `keyboardHeightWeb = max(0, innerHeight - vv.height)`.
3. Native: `Keyboard.addListener('keyboardDidShow', ...)` y `keyboardDidHide` (o `useKeyboardHandler` si existe).
4. Modificar `continueBar` style: `bottom: keyboardHeight + (insets.bottom + Spacing.base)`.
5. El componente es usado desde MapScreenVNext (web y native); debe funcionar en ambas plataformas.

---

## Fase 2: CTA sticky — Auth modal

**Archivo:** `contexts/auth-modal.tsx`

**Verificación:** Comprobar que el CTA (Iniciar sesión, Crear cuenta) está dentro de `KeyboardAvoidingView` y visible con teclado abierto. Si el modal usa layout absoluto para el botón, aplicar `bottom: keyboardHeight` igual que create-spot.

**Acción:** Revisar implementación actual; aplicar patrón keyboardHeight si el CTA queda oculto.

---

## Fase 3: CTA sticky — Edit Spot

**Archivos:** `app/spot/edit/[id].tsx`, `app/spot/edit/[id].web.tsx`

**Verificación:** Los pasos de edición tienen `KeyboardAvoidingView` y barras de botones. En web, verificar si usan `keyboardHeightWeb` para la barra fija.

**Acción:** Si la barra de guardar/cancelar no compensa el teclado en web, añadir `keyboardHeightWeb` y `bottom: keyboardHeightWeb` (patrón create-spot).

---

## Fase 4: Scroll cierra teclado — SearchFloatingNative

**Archivo:** `components/search/SearchFloatingNative.tsx`

**Cambios:**
1. En todos los `ScrollView` (isEmpty, isPreSearch, isNoResults) y en `SearchResultsListV2`: añadir `keyboardDismissMode="on-drag"`.
2. `SearchResultsListV2` recibe `keyboardDismissMode` como prop opcional; pasarlo desde SearchFloatingNative.
3. Los ScrollView directos: `keyboardDismissMode="on-drag"`.

---

## Fase 5: Scroll cierra teclado — SearchResultsListV2

**Archivo:** `components/search/SearchResultsListV2.tsx`

**Cambios:**
1. Añadir prop opcional `keyboardDismissMode?: 'none' | 'on-drag' | 'interactive'`.
2. Valor por defecto: `'on-drag'` para listas de búsqueda.
3. Pasarlo al `ScrollView` interno.

---

## Fase 6: Scroll cierra teclado — SearchOverlayWeb

**Archivo:** `components/search/SearchOverlayWeb.tsx`

**Problema:** En web no existe `keyboardDismissMode`; el teclado se cierra con `blur()` del elemento activo.

**Cambios:**
1. Crear ref al contenedor scroll o usar `onScroll` del ScrollView.
2. En `onScroll` (o `onTouchMove` si hace falta): cuando el usuario desplaza, llamar `document.activeElement?.blur()`.
3. Throttle/debounce para no hacer blur en cada frame (ej. solo si scroll delta > 10px).
4. Alternativa: `onScrollBeginDrag` equivalente en web — no existe; usar `scroll` event con flag `userScrolled` para distinguir scroll programático.

**Implementación sugerida:**
- `useRef` para `lastScrollY`, `hasScrolled`.
- `onScroll`: si `Math.abs(contentOffset.y - lastScrollY) > 10`, llamar `blurActiveElement()` y actualizar lastScrollY.
- O más simple: `onTouchStart` en el ScrollView → guardar que el usuario tocó; en `onScroll` si hubo movimiento significativo, `blur()`.

---

## Fase 7: Scroll cierra teclado — Create Spot wizard

**Archivos:** `app/create-spot/index.web.tsx`, `app/create-spot/index.tsx` (si existe native)

**Cambios:** Añadir `keyboardDismissMode="on-drag"` a los `ScrollView` de los pasos con inputs (nombre, descripción, etc.).

---

## Fase 8: Scroll cierra teclado — Edit Spot

**Archivos:** `app/spot/edit/[id].tsx`, `app/spot/edit/[id].web.tsx`

**Cambios:** Añadir `keyboardDismissMode="on-drag"` a los ScrollView que contengan TextInput.

---

## Fase 9: Verificación de autoFocus

**Ámbitos:** Search, CreateSpotNameOverlay, Create Spot wizard, Edit Spot, Auth modal.

**Acción:** Confirmar que los campos de texto relevantes tienen `autoFocus` cuando la pantalla/overlay se abre, para cumplir T1 (teclado listo para escribir).

---

## Orden de implementación sugerido

| # | Fase | Archivos | Prioridad |
|---|------|----------|-----------|
| 1 | CreateSpotNameOverlay CTA sticky | CreateSpotNameOverlay.tsx | Alta |
| 2 | Search scroll cierra teclado (Native) | SearchFloatingNative, SearchResultsListV2 | Alta |
| 3 | Search scroll cierra teclado (Web) | SearchOverlayWeb | Alta |
| 4 | Auth modal CTA sticky | auth-modal.tsx | Media |
| 5 | Edit Spot CTA + scroll | edit/[id].tsx, edit/[id].web.tsx | Media |
| 6 | Create Spot scroll | create-spot/index.web.tsx | Media |
| 7 | Verificación autoFocus | Varios | Baja |

---

## Checklist de validación

- [x] CreateSpotNameOverlay: botón Continuar visible con teclado abierto (web + native).
- [x] Search: scroll en lista cierra teclado (native + web).
- [x] Create Spot wizard: barra Siguiente visible sobre teclado; scroll cierra teclado.
- [x] Edit Spot: barra Guardar visible sobre teclado; scroll cierra teclado.
- [x] Auth modal: botón de acción visible sobre teclado.
- [ ] Campos con autoFocus donde aplique (verificación pendiente).

---

## Estado (2026-02-14)

Fases 1–8 implementadas. Fase 9 (autoFocus) pendiente de verificación.
