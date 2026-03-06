# 294 — Fix: estado programático de locate solo cuando hay movimiento real

Fecha: 2026-03-06
Tipo: Fix funcional (sin loop nuevo)

## Contexto
En el flujo de `locate` de Explore, se migró a permisos on-demand. Tras ese cambio, el handler podía marcar el mapa como `programmatic` antes de saber si habría movimiento de cámara.

Si geolocalización devolvía `denied` / `unsupported` (y sin `userCoords` fallback), no había `flyTo`/`easeTo`, pero el estado quedaba como si sí hubiera movimiento programático.

## Cambios aplicados
- Se movió `programmaticMoveRef.current = true` para ejecutarse únicamente en ramas que sí hacen movimiento de cámara.
- Se movió `setActiveMapControl('location')` a las ramas con `flyTo` real (coordenadas fresh o fallback `userCoords`).
- Se mantuvo intacta la lógica de retorno de estados (`moved`, `denied`, `timeout`, etc.).

## Evidencia (archivo)
- `hooks/useMapCore.ts`

## Validación mínima
- Revisión de diff local: solo cambios acotados en `handleLocate`.
- `npm run lint`: no ejecutable en este entorno (`expo: command not found`).

## Rollback
Revertir el commit de este fix para restaurar el comportamiento previo.
