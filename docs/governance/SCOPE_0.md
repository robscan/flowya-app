# SCOPE 0 — Gobierno del Producto

**Proyecto:** FLOWYA  
**Versión:** v0.1  
**Estado:** Activo y permanente  
**Tipo:** Regla del sistema (no feature)

---

## Objetivo

Establecer las reglas de trabajo, toma de decisiones y control de cambios para asegurar que FLOWYA crezca sin degradarse, evitando vicios estructurales, deuda innecesaria y comportamientos inconsistentes.

Scope 0 existe para proteger la simplicidad, estabilidad y confiabilidad del producto.

---

## Alcance

Scope 0 define:

- Cómo se crean, ejecutan y cierran los scopes
- Qué se considera “terminado”
- Cómo se gestionan cambios, refactors y descartes
- Qué partes del sistema se consideran estables
- Cómo se protege el producto frente a decisiones impulsivas o acumulativas

---

## No Alcance

Scope 0 NO:

- Agrega funcionalidades
- Modifica UI o UX
- Cambia flujos existentes
- Corrige bugs específicos
- Introduce optimizaciones técnicas

Cualquier acción que toque código de producto no pertenece a Scope 0.

---

## Reglas Fundamentales

### 1. Regla de Scopes

- Todo cambio debe vivir dentro de un scope
- Un scope tiene un solo objetivo
- Un scope debe poder describirse en máximo 3 líneas
- No existen scopes abiertos indefinidamente

---

### 2. Regla de Rama

- 1 scope = 1 rama
- El nombre de la rama debe reflejar el objetivo del scope
- Ningún cambio entra directo a `main`

Ejemplos:
scope/search-basic-v1
scope/map-interaction-v1
scope/spot-creation-v1


---

### 3. Regla de Cierre

Un scope se considera cerrado únicamente si:

- Cumple su objetivo original
- No rompe comportamientos existentes
- Tiene criterios de cierre verificados
- Puede eliminarse o revertirse sin afectar otros scopes

Si no cumple estas condiciones → no se mergea.

---

### 4. Regla de Descarte

- El descarte es una acción válida y saludable
- Un scope que no cierra puede:
  - Ajustarse una sola vez, o
  - Eliminarse por completo
- Las ideas descartadas se documentan y se congelan

Descartar no es perder trabajo, es evitar deuda.

---

### 5. Regla de Comportamientos Estables

Los siguientes principios se consideran estables hasta que un scope explícito los modifique:

- El mapa no ejecuta lógica de negocio
- El buscador no muta estado global
- Un spot se guarda una sola vez
- La app debe poder abrirse sin errores en cualquier estado

Cualquier cambio a estas reglas debe declararse explícitamente en el scope correspondiente.

---

### 6. Regla de Cambios Implícitos

Está prohibido:

- “Aprovechar” un scope para meter cambios extra
- Introducir decisiones para “resolver después”
- Cambiar comportamiento sin declararlo

Si algo no está en el scope → no entra.

---

### 7. Regla de Rollback

Todo scope debe poder:

- Revertirse eliminando su rama
- No dejar residuos en `main`
- No requerir parches posteriores

Si no se puede revertir, no se construye.

---

### 8. Regla de IA (Cursor / ChatGPT)

La IA:

- Solo trabaja dentro de un scope definido
- No propone cambios fuera del alcance declarado
- No introduce refactors estructurales sin aprobación explícita
- Se considera asistente, no decisor

Toda instrucción a IA debe mencionar el scope activo.

---

## Criterio de Éxito de Scope 0

Scope 0 está funcionando si:

- Existen ramas descartadas sin culpa
- El avance es deliberado, no impulsivo
- El producto se siente simple incluso al crecer
- Es posible explicar con claridad qué cambió en cada versión

---

## Declaración Final

FLOWYA prioriza:

- Confiabilidad sobre velocidad
- Claridad sobre acumulación
- Estructura sobre improvisación

Scope 0 es permanente y solo puede modificarse mediante un scope explícito de gobierno.
