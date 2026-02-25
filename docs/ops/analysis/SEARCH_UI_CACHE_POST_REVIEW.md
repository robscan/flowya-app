# Search UI Cache — Post Review

Fecha: 2026-02-25

## Objetivo

Validar si discrepancias visuales de Search (listado/orden/secciones) provienen de caché de bundle/UI y no de lógica runtime.

## Alcance

- Search overlay web/native en Explorar.
- Render final de lista (`resultsOverride`, `resultSections`, `displayResults`).
- Cadena de entrega: Metro -> bundle -> navegador/dispositivo.

## Protocolo

1. Reinicio limpio local:
   - `npx expo start --clear`
   - cerrar app/web tab y reabrir desde URL nueva de Metro
2. Invalidación de caché del cliente:
   - web: hard refresh (`Cmd+Shift+R`) y desactivar cache en DevTools
   - native: cerrar app completa y relanzar
3. Verificación de versión/código:
   - confirmar timestamp de último build visible en consola
   - confirmar que archivos modificados están cargados (logs mínimos temporales)
4. Smoke funcional:
   - query `playa` en `saved` y `visited`
   - mover viewport y validar reorden esperado según regla vigente
5. Evidencia:
   - screenshot + filtro + query + ubicación viewport + resultado observado

## Criterio de cierre

- Si tras pasos 1-4 se ve comportamiento esperado: clasificar incidencia como caché y cerrar.
- Si no: abrir bug runtime con reproducción mínima y logs de render final (`displayResults.length`, primer id visible, filtro activo).

