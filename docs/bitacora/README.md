# Bitácora — FLOWYA

La bitácora es el **registro histórico** de cómo evoluciona FLOWYA: decisiones, aprendizajes, errores, descartes y cambios de rumbo que se van tomando a lo largo del tiempo.

Su función principal es dar **trazabilidad**: permitir entender qué cambió, por qué cambió y en qué contexto se tomó cada decisión, sin tener que reconstruir la historia desde commits o conversaciones sueltas.

---

## Qué es la bitácora

- **Registro histórico**: cada entrada documenta un cambio, ajuste o reflexión concreta en un momento del tiempo.
- **Complemento de los scopes**: cada scope debe dejar rastro en la bitácora al cerrarse (qué hizo, qué no hizo, cómo se podría revertir).
- **Fuente de contexto**: ayuda a futuras decisiones evitando repetir errores o reabrir debates ya resueltos.

---

## Qué NO es la bitácora

- **No es** un documento de gobierno del producto.  
  - Las reglas de trabajo, scopes y gobierno viven en `docs/governance/SCOPE_0.md` y documentos relacionados.
- **No es** un roadmap ni una lista de tareas pendientes.  
  - El roadmap vive en los scopes y su planificación; la bitácora solo registra lo que realmente sucedió.
- **No es** documentación técnica exhaustiva.  
  - La documentación de APIs, contratos y arquitectura vive en sus propios documentos o en el código; la bitácora enlaza y resume.

La bitácora **describe el camino recorrido**, no define hacia dónde vamos ni cómo se gobierna el sistema.

---

## Relación con Scope 0

`docs/governance/SCOPE_0.md` define las reglas de gobierno del producto. La bitácora debe respetar especialmente:

- **Regla de Scopes**  
  - Todo cambio vive dentro de un scope.  
  - Cada scope debe poder explicarse en pocas líneas.
- **Regla de Rama**  
  - 1 scope = 1 rama.  
  - La bitácora referencia el scope y/o la rama donde ocurrió el cambio.
- **Regla de Cierre**  
  - Un scope solo se considera cerrado si cumple su objetivo sin romper comportamientos existentes.  
  - Parte del cierre es **actualizar la bitácora correspondiente al scope**.
- **Regla de Rollback**  
  - Todo scope debe poder revertirse eliminando su rama sin dejar residuos.  
  - La bitácora debe dejar claro qué pasaría al revertir (qué se perdería o desharía).

Cuando se defina un scope nuevo, su descripción debería incluir explícitamente:

> “Este scope incluye: actualizar bitácora correspondiente al cierre del scope.”

---

## Estructura de la carpeta `docs/bitacora`

La bitácora se organiza por **año**, **mes** y **entrada**:

- Carpeta raíz: `docs/bitacora/`
  - Documento actual: este `README.md`
  - Subcarpetas por año: `YYYY/`
    - Subcarpetas por mes: `MM/`
      - Entradas numeradas: `NNN-descripcion-corta.md`

Ejemplo:

- `docs/bitacora/2026/01/001-supabase-client.md`
- `docs/bitacora/2026/01/020-confirm-modal-logout.md`
- `docs/bitacora/2026/01/035-version-freeze-v0-34.md`

Convención de nombres:

- `NNN`: número consecutivo con tres dígitos (001, 002, 003…) que mantiene el orden histórico.
- `descripcion-corta`: resumen breve en *kebab-case* (minúsculas, palabras separadas por `-`, sin acentos ni caracteres especiales) basado en el contenido real de la entrada.

**Regla operativa (a partir del cierre del scope bitacora-restructure-v1):**

- **Enero 2026 (`2026/01/`)** queda congelado como histórico; no se añaden entradas nuevas ahí.
- Toda nueva entrada de bitácora en 2026 se crea en la carpeta **`docs/bitacora/2026/02/`** (febrero 2026).
- Numeración consecutiva propia de `02/` (p. ej. `001-mejora-consulta-spots.md`, `002-...`).
- Se respeta la convención `NNN-descripcion-corta.md`.

**Regla recordatoria (no negociable):**

- Todo scope nuevo **debe** declarar la actualización de bitácora y escribir su entrada en `2026/02/`.
- Ningún scope se considera cerrado sin su rastro en bitácora.
- Scope 0 (`docs/governance/SCOPE_0.md`) sigue siendo la fuente única de reglas de gobierno.

---

## Cómo escribir una nueva entrada

Cada entrada de bitácora debería ser:

- **Breve**: centrada en un solo cambio o decisión.
- **Fechada**: incluir la fecha explícita en el contenido.
- **Honesta**: documentar también dudas, riesgos o errores detectados.
- **Contextual**: explicar el “por qué” además del “qué”.

Contenido recomendado mínimo:

- Fecha del cambio.
- Objetivo del cambio (1–3 líneas).
- Resumen de los cambios realizados (archivos tocados, comportamientos afectados).
- Criterios de cierre (qué condiciones se consideraron para dar el scope por terminado).
- Nota de rollback (qué ocurriría si se revierte el scope).

Siempre que cierres un scope:

1. Verifica sus criterios de cierre.
2. Actualiza o crea la entrada de bitácora correspondiente bajo `docs/bitacora/YYYY/MM/` (en 2026, carpeta activa: `2026/02/`).
3. Asegúrate de que la entrada hace referencia, cuando aplique, al scope y/o rama usada.

---

## Navegación y lectura

- Usa la estructura `YYYY/MM/` para encontrar rápidamente entradas por periodo.
- Lee la bitácora como una **línea de tiempo**: ayuda a entender cómo se llegó al estado actual del producto.
- Si una entrada menciona reglas de gobierno o cambios estructurales, verifica siempre `docs/governance/SCOPE_0.md` y documentos asociados para asegurarte de que las reglas siguen vigentes.
