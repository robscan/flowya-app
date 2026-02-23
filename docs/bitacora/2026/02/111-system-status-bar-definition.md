# Bitácora 111 (2026/02) — System Status Bar: definición canónica

**Fecha:** 2026-02-23  
**Objetivo:** Documentar la definición y contrato del System Status Bar como reemplazo de toast y canal canónico de comunicación sistema-usuario.

---

## Cambios

### 1. Definición canónica

- **docs/definitions/SYSTEM_STATUS_BAR.md**
- Principio: asistente de viaje, cercano y útil.
- Ubicación: franja fija debajo de controles superiores.
- Comportamiento: hasta 3 mensajes por renglones; auto-oculta; animación typewriter/fade.
- Tono de voz: inventario actual → propuesto (redacciones mejoradas).
- Hints contextuales (futuro): inactivo 30s, sin spots, primer uso, etc.
- API: useSystemStatus (reemplaza useToast).

### 2. Contrato

- **docs/contracts/SYSTEM_STATUS_BAR.md**
- Posición, z-index, cola, timeout, estilos por tipo.
- Referencia de jerarquía z-index.
- Accesibilidad: accessibilityLiveRegion, accessibilityRole.

### 3. Índice

- **docs/contracts/INDEX.md**: entrada para SYSTEM_STATUS_BAR.

---

## Próximos pasos

1. Implementar componente `SystemStatusBar` y `useSystemStatus`.
2. Migrar llamadas de `toast.show` a `useSystemStatus().show` con textos del inventario.
3. Deprecar toast cuando la migración esté completa.
