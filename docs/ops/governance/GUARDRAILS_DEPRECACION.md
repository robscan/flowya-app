# Guardrails de deprecación

**Última actualización:** 2026-02-14

> Reglas para marcar, documentar y eliminar código/servicios deprecated de forma gradual y segura.
> Usar este documento en cada sesión para detectar qué deprecado está listo para borrar.

---

## 1. Proceso en 3 fases

| Fase | Acción | Criterio para pasar a siguiente |
|------|--------|---------------------------------|
| **Fase 1 — Marcar** | Comentario `@deprecated` en código; entrada en tabla de este doc; contratos actualizados | Ningún flujo activo depende del elemento |
| **Fase 2 — Desconectar** | Quitar entry points (links, rutas, botones); no eliminar código todavía | Período sin referencias (recomendado: 1 sprint) |
| **Fase 3 — Eliminar** | Borrar archivos/código; actualizar layout, imports, tests | Bitácora registrada; PR acotado |

---

## 2. Elementos deprecated (registro)

> Actualizar esta tabla cuando se marque o elimine algo.

| Elemento | Motivo | Fase | Marcado | Eliminado | Notas |
|----------|--------|------|---------|-----------|-------|
| Marker+MapPinSpot para spots en MapCoreView | Reemplazado por SymbolLayer en useMapCore | 3 | 2026-02-14 | 2026-02-14 | Spots ahora como capa nativa debajo de POI |
| Modal POI (Agregar spot / Por visitar) | Sustituido por POISheetMedium | 3 | 2026-02-14 | 2026-02-14 | Nueva sheet: Compartir, Por visitar, Cerrar |
| `/mapaV0` (MapScreenV0) | Legacy; entry real es `/` | 1 | 2026-02-14 | — | Fase 2: quitar de _layout; Fase 3: borrar app/mapaV0.* y MapScreenV0 |
| Flujo wizard largo create-spot | Sustituido por draft + creador mínimo | 1 | 2026-02-14 | — | Verificar si /create-spot se usa; si no, deprecar |
| `onOpenDetail` en SpotSheet | Flujo actual = expanded sin navegar a SpotDetail | 1 | 2026-02-14 | — | Hacer opcional o eliminar prop si no hay CTA |
| `getPinsForSpotsLegacy` | Migración 011 (saved/visited) | 1 | 2026-02-14 | — | Eliminar con MapScreenV0 |
| Sugerencias ES↔EN (no results) | Sin criterio útil; reemplazar por mapPoiResults | 1 | 2026-02-22 | — | SearchOverlayWeb + SearchFloatingNative; `{false && ...}` |

---

## 3. Checklist pre-eliminación (Fase 3)

Antes de borrar código:

- [ ] Ningún flujo activo usa el elemento
- [ ] No hay deep links activos que dependan de la ruta (o hay alternativa)
- [ ] Bitácora con decisión y alcance
- [ ] PR con scope mínimo y descripción clara
- [ ] Regresión manual mínima documentada

---

## 4. Vigilancia (cuándo borrar)

En cada sesión o al retomar trabajo:

1. **Revisar tabla (sección 2)**: ¿algún elemento en Fase 2 lleva tiempo sin referencias?
2. **Grep/audit**: buscar imports y rutas del elemento
3. **Si está limpio**: pasar a Fase 3, generar bitácora, PR
4. **Actualizar este doc**: columna "Eliminado" con fecha

---

## 5. Referencias

- **Deprecados eliminados (V3):** `docs/ops/strategy/DEPRECATED_V3_CLEANUP.md`
- **Contratos:** `docs/contracts/INDEX.md` — marcar como DEPRECATED (fecha) cuando aplique
- **OPEN_LOOPS:** OL-DEPREC-001 en `docs/ops/OPEN_LOOPS.md`
