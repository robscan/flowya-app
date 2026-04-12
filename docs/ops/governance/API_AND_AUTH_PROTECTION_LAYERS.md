# Capas de protección — Login, APIs de mapas y coste

**Última actualización:** 2026-04-12  
**Estado:** GOVERNANCE (lineamientos; no sustituye políticas del proveedor)

**Objetivo:** que el **login obligatorio** y la **seguridad backend** trabajen juntos para **reducir abuso** y **coste** (Mapbox, geocoding, etc.), no solo para privacidad del usuario.

---

## 1. Por qué el login no basta solo en el cliente

Las llamadas que usan tokens o cuotas **visibles en el navegador** pueden seguir siendo abusadas (scripts, automatización, sesiones repetidas). El login mejora la **atribución** y permite **políticas por usuario**, pero debe combinarse con controles en **servidor/proveedor**.

---

## 2. Capas que suelen combinarse

| Capa | Qué hace | Ejemplo / notas |
|------|-----------|-----------------|
| **A. Producto / UX** | Sesión requerida para usar la app o para acciones costosas | Sin usuario autenticado → no Explore completo / no búsqueda ilimitada (definir con producto). |
| **B. Identidad** | Supabase Auth (magic link, etc.); `auth.uid()` en políticas | Reduce tráfico anónimo sin identidad. |
| **C. Datos (RLS + políticas)** | Lectura/escritura según `auth.uid()`; sin usuario → mínimo o nada | Ya alineado con spots/pins; revisar en `OL-SECURITY-VALIDATION-001`. |
| **D. Proxy / Edge / backend** | Las claves del proveedor no expuestas; rate limit por IP/usuario | Si el token Mapbox está solo en cliente, evaluar restricciones de URL en Mapbox + cuotas de cuenta. |
| **E. Proveedor (Mapbox, etc.)** | Budget alerts, rotación de tokens, restricciones de referrer/URL | Mitigación principal contra scraping masivo de la misma clave. |
| **F. Observabilidad** | Métricas de uso por ruta (sin PII innecesario) | Detectar picos anómalos antes de facturación. |

---

## 3. Relación con loops vigentes

- **`OL-SECURITY-VALIDATION-001`:** validar que mutaciones y lecturas sensibles cumplen B+C.
- **`OL-PROFILE-001`:** preferencias (idioma, unidades) atadas a usuario autenticado.
- **Login obligatorio (decisión producto):** documentada en `OPEN_LOOPS.md` § Decisiones producto.

---

## 4. Revisión periódica

Al cambiar de plan Mapbox o añadir nuevas APIs de pago, repetir checklist A–F.
