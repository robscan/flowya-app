# 385 — SpotSheet media hero canon and upload progress

Fecha: 2026-04-26

## Contexto

QA confirmó que el picker y la carga pesada funcionaban, pero reveló un bug de canon: un spot con imagen pública existente podía mostrar el CTA de agregar imagen como si no tuviera portada. El caso aparecía especialmente en `Visitados`, porque el contrato/runtime ocultaba la portada pública cuando no existían fotos personales.

Producto definió el comportamiento esperado:

- `Todos` y `Por visitar`: mostrar imagen pública/canónica disponible.
- `Visitados`: mostrar imagen pública/canónica como fallback y mantener CTA para invitar a subir fotos propias.
- Si existen fotos personales del usuario en `Visitados`, priorizarlas para ese usuario.

## Cambio aplicado

- `MapScreenVNext` ahora construye un hero canónico para el spot seleccionado:
  - override/optimista durante upload;
  - fotos personales si existen en `Visitados`;
  - galería pública;
  - fallback a `cover_image_url` legacy en `SpotSheet`.
- `SpotSheet` deja de ocultar la portada pública en `Visitados`.
- El CTA “Subir fotos” se muestra como acción complementaria encima del hero cuando ya hay imagen.
- Se agrega barra horizontal mínima de progreso por archivos procesados durante upload desde spot existente.

## Decisión

La portada pública/canónica no debe perderse como fallback visual. Las fotos personales son una capa de memoria del usuario, no un reemplazo destructivo del cover público.

## Pendiente

- QA manual web móvil.
- Cola formal con límite de concurrencia.
- Progreso byte-level solo si se cambia a un uploader que exponga progreso real.
- Canon media path-first (`storage_path` + helper URL) fuera de este micro-scope.

## Validación

- `npm run typecheck`

