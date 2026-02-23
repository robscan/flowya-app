# Plan: System Status Bar — implementación

**Estado:** Documentado para ejecutar en siguiente sprint.  
**Prioridad:** Alta (comunicación sistema-usuario).  
**Última actualización:** 2026-02-23

> Definición canónica: [docs/definitions/SYSTEM_STATUS_BAR.md](../definitions/SYSTEM_STATUS_BAR.md)  
> Contrato: [docs/contracts/SYSTEM_STATUS_BAR.md](../contracts/SYSTEM_STATUS_BAR.md)

---

## Alcance

Crear el componente y hook `useSystemStatus` según la definición canónica, sustituir `ToastProvider` por `SystemStatusProvider`, y migrar todas las llamadas a `toast.show` con los textos propuestos del inventario.

---

## Fase 1: Componente y Provider

- Crear `components/ui/system-status-bar.tsx`: cola de hasta 3 mensajes, posición fija debajo de controles, fade-in, accesibilidad.
- Crear `lib/system-status-messages.ts` con textos canónicos.
- Sustituir `ToastProvider` por `SystemStatusProvider` en `app/_layout.tsx`.

---

## Fase 2: Migración de llamadas

Archivos: MapScreenVNext, app/spot/[id].web, app/spot/edit/[id].web, app/spot/edit/[id], MapScreenV0, flowya-beta-modal.

---

## Fase 3: Deprecar Toast

Marcar toast como deprecated; entrada en GUARDRAILS_DEPRECACION; bitácora.

---

## Riesgos (estrategia más segura)

- **Big bang:** Migrar todos los call sites antes de quitar ToastProvider, o usar coexistencia (ToastProvider delega en SystemStatusBar).
- **Posición:** Validar top fijo en spot detail/edit; ajustar si solapa header.
