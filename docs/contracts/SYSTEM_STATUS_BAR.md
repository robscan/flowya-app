# Contrato: System Status Bar

**Fuente de verdad:** [docs/definitions/SYSTEM_STATUS_BAR.md](../definitions/SYSTEM_STATUS_BAR.md)  
**Última actualización:** 2026-02-23

---

## Comportamiento UI

- **Posición:** `position: absolute`, debajo de controles superiores. `top` = altura de filter row + insets.
- **Z-index:** Por encima del mapa (≥10); por debajo de modales full-screen (CreateSpotNameOverlay, Auth, Search).
- **Cola:** Hasta 3 mensajes visibles; cada uno en su línea; se ocultan en bloque tras el timeout.
- **Timeout:** 2500 ms por mensaje o por lote (cuando se ocultan todos a la vez).
- **Animación:** Entrada con fade-in o typewriter; salida con fade-out.

---

## Jerarquía z-index (referencia)

| Elemento | z-index |
|----------|---------|
| Mapa | 0 |
| MapControls, filter overlay | 10–11 |
| System Status Bar | 12 |
| SpotSheet | 10–15 |
| Search overlay | 15 |
| CreateSpotNameOverlay, Auth modal | 16 |

---

## Estilos por tipo

| Tipo | Background | Texto |
|------|------------|-------|
| success | `colors.stateSuccess` | `#ffffff` |
| error | `colors.stateError` | `#ffffff` |
| default | `colors.backgroundElevated` | `colors.text` |

---

## Accesibilidad

- `accessibilityLiveRegion="polite"` para que lectores de pantalla anuncien el mensaje.
- `accessibilityRole="status"` en el contenedor.
