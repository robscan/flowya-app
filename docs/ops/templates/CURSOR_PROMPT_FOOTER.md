---
CURSOR — CLOSEOUT (MANDATORY)

Este micro-scope NO se considera terminado hasta cumplir TODO:

1. Git
- `main` está protegido: **NO direct commit / NO direct push**.
- Crear rama desde `main`.
- Commit claro (1 micro-scope).
- Push a la rama.
- Abrir PR y mergear según reglas del repo.

2. CURRENT_STATE
- Actualizar **entregando el archivo completo final**:
  - Scope activo
  - Branch
  - Commit / PR
  - Qué está sólido
  - Qué está frágil
  - Next step (1 línea)

3. OPEN_LOOPS
- Actualizar **entregando el archivo completo final**:
  - SOLO loops activos
  - Eliminar loops cerrados
  - Abrir nuevos loops si aparecen (con DoD, owner y prioridad)

4. Evidencia
- Si hubo cambio real: PR, commit o bitácora.
- Si no hubo cambio de código: justificar explícitamente.

5. Regla final
- Si hay duda → el loop queda OPEN.
- Nunca asumir DONE sin evidencia.
---
