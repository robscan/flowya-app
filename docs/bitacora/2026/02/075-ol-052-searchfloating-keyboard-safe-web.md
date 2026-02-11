# Bitácora 075 (2026/02) — OL-052: SearchFloating keyboard-safe (web mobile)

**Rama:** `fix/ol-052-searchfloating-keyboard-safe`  
**PR:** #28 (merge 851e690)  
**Objetivo:** Con teclado abierto en mobile (especialmente web), input y lista visibles sin empalme; solución por insets/padding, sin hacks de height.

## Contexto

- SearchFloating ya usaba KeyboardAvoidingView (iOS). En web el teclado tapaba input/lista.
- Referencia: app/create-spot/index.web.tsx usa window.visualViewport para keyboardHeightWeb.

## Implementación

- **Archivo:** `components/search/SearchFloating.tsx`.
- **Web:** Estado `keyboardHeightWeb` + useEffect (solo Platform.OS === 'web', window.visualViewport). Fórmula: `max(0, innerHeight - vv.height - vv.offsetTop)`. Listeners resize/scroll; update() al montar; cleanup.
- **Padding:** En el View resultsArea, en web y cuando keyboardHeightWeb > 0: `paddingBottom: keyboardHeightWeb`. No se cambia altura del sheet.
- **Layout:** `resultsScroll` con `minHeight: 0`; `resultsArea` mantiene `flex: 1`, `minHeight: 0`.
- **Sin cambios:** KeyboardAvoidingView (iOS padding), panGesture, dragArea, keyboardShouldPersistTaps.

## Archivos tocados

- `components/search/SearchFloating.tsx`

## Referencia

- PR #28 (merge 851e690).

## QA

Web mobile: abrir search → enfocar input → teclado abre → input visible, lista scrolleable → tap resultado → cerrar. iOS: mismo flujo sin regresión.
