# Plan: Search cold-start con tendencias globales (sin backend Flowya)

Fecha: 2026-03-06  
Estado: Implementado  
Prioridad: Alta (coherencia UX en vista inicial global)

## Objetivo

Evitar que la búsqueda vacía en vista inicial global (fallback) muestre pocos resultados locales de París y, en su lugar, presentar recomendaciones globales útiles solo al inicio de sesión.

## Alcance

### In scope

1. Mostrar secciones globales solo en cold-start:
- `Paises populares`
- `Lugares populares`

2. Activación estricta:
- búsqueda abierta,
- query vacía,
- filtro `all`,
- sin geolocalización concedida,
- sin interacción previa de intención (pan/zoom manual, locate/world, escribir query, seleccionar resultado).

3. Desactivación permanente en sesión:
- al primer gesto/intención del usuario;
- no reactivar aunque vuelva manualmente a París.

4. Semillas curadas locales (sin backend):
- lista versionada en repo,
- orden aleatorio por sesión,
- validación de rangos de coordenadas.

5. Confirmación al tocar lugar semilla:
- resolver con búsqueda externa global (`searchPlacesPOI/searchPlaces`) antes de enfocar;
- si resolución falla, usar coordenada semilla como fallback.

### Out of scope

1. `Populares en Flowya` (sin backend agregado en esta fase).
2. Nuevos endpoints o jobs de agregación.

## Criterios de aceptación

1. En primer load global + búsqueda vacía: aparecen secciones globales, no solo spots de París.
2. Tras primera interacción del usuario, la búsqueda vuelve al flujo normal local/contextual.
3. Tap en item semilla enfoca un punto real del mapa confirmado por resolución externa cuando disponible.
4. Sin regresiones de lint/runtime.

## Rollback

Revertir este cambio restaura empty-state anterior basado solo en resultados locales/visibles del mapa.
