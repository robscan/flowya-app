# CURRENT_STATE — Flowya (operativo)

> **Fuente de verdad del estado actual del proyecto.**
>
> Este archivo es un **snapshot operativo + memoria resumida**.
> No es planeación ni backlog.
>
> 🔒 **Regla:** ningún chat/sprint se considera cerrado si este archivo no se actualiza.

---

## Ahora mismo

- **Scope activo:** Ops — cierre de loops de seguridad antes de nuevos UX scopes.
- **Branch activa:** `main`.
- **Commit / tag de referencia:** último commit en `main` (prod Vercel).
- **Entorno afectado:** Web mobile (prod desde `main`).

### Sólido

- Explore (map-first) es el único producto abierto.
- Search V2 y Create Spot Lite operativos en prod.
- Guardrails activos: **NO abrir Flow ni Recordar completos**.
- Arquitectura retomable sin depender de memoria de chat.

### Frágil / Atención

- Existen **OPEN LOOPS activos de seguridad**:
  - OL-007 (Supabase RLS permisivo).
  - OL-008 (Auth: leaked password protection deshabilitado).

### Next step (1 línea)

Cerrar **OL-008** y después **OL-007** antes de abrir cualquier feature nuevo.

---

## Historial relevante (memoria resumida)

- **OL-001 → OL-006 cerrados**
  - Se restauró la retomabilidad del proyecto (CURRENT_STATE + OPEN_LOOPS).
  - Se documentaron y fijaron **gates de Flow / Recordar** (modo _lite_).
  - Se alinearon contratos CURRENT con el estado real del sistema.
  - Se estabilizó Search V2 y Create Spot Lite en prod.

> Este historial no es exhaustivo:  
> la evidencia vive en git, bitácoras y PRs.

---

## Qué está bloqueado por regla (guardrails)

Mientras exista **cualquier OPEN LOOP**:

- ❌ No se amplía superficie de datos.
- ❌ No se abren Flow ni Recordar completos.
- ❌ No se agregan features no esenciales.
- ✅ El foco es **estabilidad + seguridad por default**.

---

## Regla de cierre (NO NEGOCIABLE)

Al final de **cada sesión** (con o sin Cursor):

1. Este archivo debe reflejar el estado real (sin placeholders).
2. `OPEN_LOOPS.md` debe estar alineado con lo aquí descrito.
3. Si hay duda → el loop queda **OPEN**, nunca se asume cerrado.

Si esto no se cumple, la sesión **no está cerrada**.

## Regla del repositorio (infra)

- El branch `main` está **protegido**.
- No se permiten commits ni pushes directos.
- Todo cambio (incluidos docs-only) requiere **rama + PR**.

Esta regla es parte del sistema operativo del proyecto.
