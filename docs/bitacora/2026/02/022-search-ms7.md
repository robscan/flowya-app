# Bitácora 022 (2026/02) — B2-MS7: Estados vacíos y mensajes canónicos

**Micro-scope:** B2-MS7  
**Rama:** `search/B2-MS7-estados-vacios`  
**Objetivo:** Search nunca "falla"; siempre hay acción clara (lista, CTA o mensaje explícito).

---

## Qué se tocó

- **app/(tabs)/index.web.tsx:** Cuando el query está vacío y no hay spots cercanos (`defaultSpots.length === 0`), se muestra un estado vacío canónico con el mensaje: "No hay spots cercanos. Mantén pulsado el mapa para crear uno." En lugar de una lista vacía sin contexto.
- Comprobado: no hay mensajes de error genéricos en la UI de Search; los únicos usos de "error" en el archivo son estilos/iconos (logout, cerrar), no texto de fallo de búsqueda.

---

## Qué NO se tocó

- Create Spot, handoff, resolución, orden. Textos de los otros estados (sin resultados con query, lista con resultados) ya eran canónicos.

---

## Criterio de cierre

- Todos los estados vacíos tienen mensaje y/o acción definida: query vacío con spots → lista; query vacío sin spots → mensaje + hint; query con resultados → lista; query sin resultados → mensaje + CTA crear.
- Build limpio.

---

## Rollback

- Restaurar el bloque "query vacío" a un único ScrollView con defaultSpots.map sin condicional por defaultSpots.length; eliminar el View con "No hay spots cercanos...".
