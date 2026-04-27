# FLOWYA Performance & Reliability System

**Estado:** CANONICO / PERFORMANCE Y CONFIABILIDAD
**Fecha:** 2026-04-27

---

## 1. Proposito

FLOWYA debe sentirse rapida, estable y confiable, especialmente en mobile, mapa, busqueda, media y viaje real con red imperfecta.

Performance no es optimizacion prematura: es proteger la experiencia emocional de interrupciones, bloqueos y esperas opacas.

---

## 2. Areas sensibles

- startup;
- mapa;
- Search;
- sheets;
- listas largas;
- imagenes/media;
- uploads;
- Supabase queries;
- Storage;
- IA;
- pagos/membresia;
- offline/slow network.

---

## 3. Reglas base

- No bloquear UI principal por llamadas no criticas.
- Mostrar loading meaningful si tarda.
- Evitar refetch completo tras mutaciones simples si patch local basta.
- Cancelar/ignorar respuestas obsoletas.
- Debounce/throttle en busqueda y mapa.
- No montar listas pesadas sin virtualizacion.
- Imagenes deben tener fallback y tamanos razonables.
- Fallas de red deben preservar contexto.
- Operaciones caras deben tener rollback o retry claro.

---

## 4. Reliability

Toda accion persistente debe definir:

- idempotencia o dedupe;
- estado in-flight;
- retry/rollback;
- error visible;
- que pasa si la app se cierra;
- que pasa si la red falla.

Especial atencion:

- guardar spot;
- guardar geo;
- agregar a Flow;
- subir fotos;
- cambiar privacidad;
- pagar;
- compartir.

---

## 5. Checklist Performance/Reliability por PR

```md
## Performance / Reliability
- Operacion sensible:
- Loading/slow state:
- Error/retry:
- Dedupe/idempotencia:
- Refetch controlado:
- Lista/mapa/media optimizados:
- Offline/poor network:
- Rollback:
```
