# DISEÑO UX — OL-CONTENT-001.B (2026-03-03)

Estado: DISEÑO PROPUESTO (planificación)  
Loop: `OL-CONTENT-001.B`  
Dependencia: `OL-CONTENT-001.A` (persistencia privada lista)

---

## 1) Objetivo de diseño

Hacer que editar contenido personal del spot sea inmediato, claro y sin fricción desde los dos contextos de mayor uso:

1. SpotSheet (modo spot).
2. Search en filtro `visited`.

Contenido a editar (privado):
- `nota breve` (privado).
- `por qué importa` (privado).
- imagen de portada (pública; entry rápida).

Regla de visibilidad (siempre explícita en UI):
- Imagen: **pública**.
- Notas: **solo visibles para el usuario**.

---

## 2) Principios UX (no negociables)

1. **Map-first intacto:** no romper selección, cámara ni jerarquía de sheet.
2. **Un owner de teclado:** nunca dos editores activos.
3. **Una intención por acción:** cada quick action abre un editor específico.
4. **Persistencia explícita:** usuario siempre entiende cuándo guardó.
5. **Sin sobrecarga visual:** máximo 3 quick actions visibles por contexto.

Referencias:
- `docs/contracts/EXPLORE_SHEET.md`
- `docs/contracts/KEYBOARD_AND_TEXT_INPUTS.md`
- `docs/contracts/SPOT_SELECTION_SHEET_SIZING.md`

---

## 3) Arquitectura de interacción

### 3.1 SpotSheet (contexto principal)

#### Estado `medium`
- Mostrar fila `Acciones rápidas` debajo del bloque principal de estado:
  - `Imagen`
  - `Nota breve`
  - `Por qué importa`
- Cada acción abre editor ligero superpuesto (no navegación).

#### Estado `expanded`
- Mantener mismas acciones al inicio del contenido.
- Si ya existe contenido privado:
  - mostrar preview breve (1-2 líneas) debajo de cada acción.

### 3.2 Search (`pinFilter=visited`)

- Mantener quick actions en card de resultado:
  - `Agregar imagen` (si falta).
  - `Escribir nota breve` (si falta o vacía).
  - `Por qué importa` (nuevo quick action, visible si falta).
- Tap en quick action no abre SpotSheet; edita inline/overlay y vuelve a lista.

---

## 4) Componentes propuestos

1. `SpotSheetQuickActionsRow`
- Renderiza 3 botones compactos homogéneos.
- Props:
  - `hasImage`
  - `hasShortNote`
  - `hasWhyNote`
  - handlers por acción

2. `PrivateNoteEditorOverlay`
- Modal ligero reutilizable para:
  - `short_note`
  - `why_note`
- Props:
  - `mode: "short_note" | "why_note"`
  - `initialValue`
  - `maxLength`
  - `onSave`
  - `onClose`

3. `SearchResultCard` / `SearchListCard` extensión
- Nuevo quick action `why_note`.
- Estado “guardando” por item para evitar taps múltiples.

---

## 5) Diseño visual y microcopy

### 5.1 Etiquetas de acciones

- `Imagen (pública)`
- `Nota breve`
- `Por qué importa`

### 5.2 Placeholders

- Nota breve: `Escribe una nota personal breve sobre este lugar.`
- Por qué importa: `¿Qué hace especial este lugar para ti?`

### 5.3 Mensajes de privacidad visibles

- Debajo de acción de imagen o dentro del editor:
  - `Esta imagen será visible para otros usuarios.`
- Debajo de acciones de notas o dentro del editor:
  - `Estas notas son privadas y solo tú las puedes ver.`

### 5.4 Feedback

- Éxito:
  - `Nota breve guardada.`
  - `Por qué importa guardado.`
  - `Imagen actualizada.`
- Error:
  - `No se pudo guardar. Intenta de nuevo.`

### 5.5 Reglas de longitud (UX)

- `nota breve`: 280 chars.
- `por qué importa`: 800 chars (v1).
- Mostrar contador solo al superar 70% del límite.

---

## 6) Comportamientos detallados

### 6.1 Apertura de editor

1. Usuario toca action.
2. Se blurea cualquier input activo previo.
3. Se abre overlay con autofocus en textarea.
4. CTA primario `Guardar`, secundario `Cancelar`.

### 6.2 Guardado

1. `Guardar` deshabilita inputs y muestra loading.
2. Persistir en capa privada user-owned.
3. Cerrar overlay al éxito.
4. Refrescar datos locales del spot/card sin refetch completo inmediato.

### 6.3 Cancelación

- `Cancelar` o tap backdrop:
  - si hay cambios sin guardar, confirmar descarte.
  - si no hay cambios, cerrar directo.

### 6.4 Prioridad de overlays

Si abre `Create Spot Paso 0` o Search cambia de owner:
- cerrar editor privado activo.
- preservar cambios no guardados solo si confirmados por usuario.

---

## 7) Reglas por plataforma

### Web
- Overlay keyboard-safe con `visualViewport` (sin `100vh`).
- Evitar nesting de botones en cards.
- Blur al scroll en Search para cerrar teclado.

### Native
- `KeyboardAvoidingView` + `keyboardDismissMode="on-drag"` en listas.
- No bloquear gesto principal de sheet.

---

## 8) Edge cases

1. Usuario no autenticado:
- abrir auth modal antes de editar.

2. Spot desaparece/oculto durante edición:
- abortar guardado y mostrar error controlado.

3. Guardado parcial (nota ok, sync UI falla):
- forzar refetch puntual del spot para consistencia.

4. Cambios concurrentes (otra vista):
- última escritura gana; mostrar valor final persistido.

---

## 9) Criterios de validación UX

1. Usuario edita en <= 2 taps desde SpotSheet.
2. Usuario edita desde Search sin salir de contexto.
3. No hay overlays apilados ni foco ambiguo.
4. Confirmación de guardado visible en < 1s.
5. Persistencia estable tras recargar sesión.

---

## 10) Orden de implementación sugerido (diseño -> build)

1. Construir `PrivateNoteEditorOverlay` reusable.
2. Integrar en SpotSheet (acciones + previews).
3. Integrar en Search (quick actions parity).
4. Afinar microcopy y estados de carga/error.
5. QA cross-platform y cierre documental.
