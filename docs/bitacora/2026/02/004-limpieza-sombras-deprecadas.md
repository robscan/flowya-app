# Bitácora 004 (2026/02) — Limpieza de sombras deprecadas (shadow*)

**Scope:** scope/cleanup-shadow-deprecated-v1  
**Estado:** Cerrado  
**Fuente de reglas:** docs/governance/SCOPE_0.md

---

## Motivo del cambio

La app mostraba la advertencia: `"shadow*" style props are deprecated. Use "boxShadow"`. Se eliminan todas las props de estilo `shadow*` para dejar la consola limpia, sin sustituirlas por `boxShadow`.

---

## Componentes / archivos afectados

- **constants/theme.ts:** `Shadow.subtle` y `Shadow.card` pasan a ser `{}` en todos los entornos (se dejan de usar `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` y `elevation` en Shadow).
- **components/design-system/map-pins.tsx:** Eliminado el bloque condicional de halo (shadow*) en el estado hover del pin de spot.
- **components/ui/create-spot-confirm-modal.tsx:** Eliminado el spread `...Platform.select({ ios: shadow*, android: elevation })` del estilo `sheet`; eliminado import no usado `Platform`.
- **components/ui/flowya-beta-modal.tsx:** Eliminado el spread de sombra del estilo `sheet`.
- **components/ui/confirm-modal.tsx:** Eliminado el spread de sombra del estilo `sheet`; eliminado import no usado `Platform`.
- **contexts/auth-modal.tsx:** Eliminado el spread de sombra del estilo `sheet`.

Los consumidores de `Shadow.subtle` y `Shadow.card` (icon-button, spot-detail, spot-card, cards, toast, design-system.web) no se modifican; al ser ahora objetos vacíos, los spreads no aplican ninguna prop y no generan warning.

---

## Decisión explícita

En FLOWYA no se usan sombras por ahora (ni `shadow*` ni `boxShadow`). La prioridad fue eliminar la fuente del warning y mantener la consola limpia; los componentes pueden verse más planos (aceptable).

---

## Confirmación de consola limpia

Tras los cambios, la advertencia `"shadow*" style props are deprecated` no debe aparecer. Verificación: ejecutar la app y `npm run build`.

---

## Rollback

Revertir el commit (o la rama) de este scope restaura las sombras sin afectar lógica de negocio, estados ni flujos.
