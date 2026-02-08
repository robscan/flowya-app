# Seguridad baseline (v0.1)

**Fecha:** 2026-02-07  
**Objetivo:** Dejar Flowya listo para crecer sin “deuda de seguridad” desde el MVP.

---

## 1) Supabase / DB

### RLS (Row Level Security) obligatorio
- `spots.user_id = auth.uid()` como regla base.
- Ninguna tabla con datos de usuario debe ser pública por defecto.

### Policies mínimas
- `SELECT/INSERT/UPDATE/DELETE` solo del dueño.
- Si hay contenido público (futuro), separarlo en tablas o vistas.

### Validaciones server-side
- `status` enum controlado.
- `lat/lng` rango válido.
- `title` length limit.

---

## 2) Storage (fotos)
- Buckets privados por usuario (default).
- URLs firmadas con expiración corta para lectura.
- Límite de tamaño por archivo + compresión cliente.

---

## 3) Rate limiting y abuso
- Limitar:
  - requests de búsqueda a proveedor (Mapbox)
  - creación masiva de spots
- Logging de eventos para detectar patrones (ver `analytics/ACTIVITY_LOG_EVENTS.md`).

---

## 4) PII minimization
- No guardar contactos/imports sin necesidad.
- Teléfono/website del lugar: ok, pero tratarlo como “metadata” no como PII del usuario.

---

## 5) Keys y secretos
- Keys de Mapbox solo en server (si aplica) o con restricciones por dominio/app id.
- Rotación documentada.

---

## 6) Backups y migraciones
- Migraciones SQL versionadas.
- Backup automático (Supabase) + plan de restore probado al menos 1 vez.

