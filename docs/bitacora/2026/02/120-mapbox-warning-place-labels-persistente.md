# 120 — Warning Mapbox persistente: `featureNamespace place-A ... place-labels`

Fecha: 2026-02-25

## Contexto

En Explore (FLOWYA-only) persiste en consola el warning:

`featureNamespace place-A of featureset place-labels's selector is not associated to the same source, skip this selector`

## Estado actual

- Warning reproducible tras limpiar caché (`expo start --clear` + hard reload browser).
- No bloquea render ni interacción principal del mapa.
- Es ruido de consola que dificulta diagnóstico de otros problemas.

## Acciones ya probadas en esta sesión

- Desactivado ajuste runtime de idioma (`MapboxLanguage`) en `useMapCore`.
- Desactivada activación runtime de landmarks (`enableLandmarkLabels: false`) para evitar warnings/404 adicionales.
- Ajustado log-level de Mapbox a `error`; el warning reportado por usuario persiste en su entorno.

## Hipótesis

- El warning proviene del style/import de Mapbox Studio (`place-labels` featureset/source mapping), no de lógica funcional de Flowya.

## Próximo abordaje (pendiente)

1. Revisar en Mapbox Studio el style FLOWYA (imports/featuresets de `place-labels`).
2. Publicar revisión del style y volver a validar en entorno limpio.
3. Si persiste, subir issue de compatibilidad contra versión `mapbox-gl` usada en app.

## Referencias

- `docs/ops/OPEN_LOOPS.md` (OL-MAPBOX-001)
- `docs/bitacora/2026/02/106-consola-warnings-fix-mapbox-doc.md`
