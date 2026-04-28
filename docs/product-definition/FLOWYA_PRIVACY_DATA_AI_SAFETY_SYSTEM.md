# FLOWYA Privacy, Data & AI Safety System

**Estado:** CANONICO / SAFETY
**Fecha:** 2026-04-27

---

## 1. Proposito

FLOWYA maneja ubicacion, viajes, fotos, recuerdos, planes y eventualmente pagos. Estos datos pueden ser sensibles.

La regla es simple: el usuario debe sentir que FLOWYA lo cuida, no que lo explota.

---

## 2. Privacidad

Reglas:

- Privacidad no se bloquea por membresia.
- Fotos privadas nunca se vuelven portada publica sin consentimiento.
- Share debe declarar que incluye.
- Recuerdos son privados por defecto.
- Ubicacion actual no se comparte sin accion explicita.
- Exportar/eliminar datos debe existir como compromiso de Account.

---

## 3. Datos

Reglas:

- No hard delete sin aprobacion explicita.
- No Storage delete por SQL.
- RLS se verifica si se toca datos.
- No secretos en docs, scripts, env o commits.
- Paises/regiones/ciudades no son `spots`.
- Datos criticos requieren fuente/frescura.
- Migraciones deben tener rollback o mitigacion.

---

## 4. IA

Reglas:

- IA sugiere; el usuario decide.
- No persistir sugerencias IA sin confirmacion.
- No presentar IA como certeza.
- Explicar cuando una recomendacion es generada o inferida.
- No usar recuerdos privados para recomendaciones compartibles sin permiso.
- Controlar costo y abuso antes de escalar.

---

## 5. Membresia

Reglas:

- Paywall explica valor real.
- No esconder seguridad, privacidad, exportacion o soporte.
- No usar urgencia falsa.
- No crear ansiedad para vender.
- Cancelar/downgrade no debe borrar datos del usuario sin politica clara.

---

## 6. Checklist Privacy/Data/AI por PR

```md
## Privacy / Data / AI Safety
- Datos tocados:
- RLS/Storage:
- Consentimiento:
- Share/public/private:
- IA explicable/editable:
- Fuente/frescura:
- Secretos:
- Rollback:
- Paywall etico:
```
