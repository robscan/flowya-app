# 377 — Fix: picker de fotos en SpotSheet + toast no bloqueante

**Fecha:** 2026-04-21  
**Rama:** `fix/photo-picker-and-toast-pass-through`  
**PR:** [#160](https://github.com/robscan/flowya-app/pull/160)

## Síntomas

1) En `SpotSheet`, cuando un spot no tiene imágenes y aparece el CTA **«Subir mis fotos»**, al tocarlo solo se mostraba el **loader** y **nunca** se abría el image picker (web).  
2) Los **toasts** capturaban taps fuera de su bloque visual y podían **impedir interacción** con UI debajo.

## Causa raíz

- **Picker web**: algunos navegadores requieren que el file picker se dispare directamente desde el **gesto del usuario**. Si el handler hace `await` antes de `input.click()`, el navegador puede **bloquear** el picker silenciosamente; la UI ya había activado estado “busy”, quedando en loader.
- **Toast**: el contenedor del toast en top-center usaba `alignSelf: 'stretch'` en el `Pressable`, expandiendo su área interactiva a todo el ancho del overlay (aunque el fondo sea transparente).

## Solución

- `components/explorar/MapScreenVNext.tsx`
  - En `handleQuickAddImageFromSearch` (web): lanzar `pickImageFilesFromWeb(...)` **antes** de cualquier `await` (mantener gesto), y activar `busy` solo después de confirmar selección.
- `components/ui/system-status-bar.tsx`
  - En `stackTopCenter`: cambiar `alignSelf` a `'center'` para que el hitbox del `Pressable` no “estire” y no capture taps fuera del toast.

## Verificación

- `npm run typecheck`

