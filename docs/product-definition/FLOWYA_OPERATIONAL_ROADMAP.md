# FLOWYA Operational Roadmap

**Estado:** CANONICO / PLAN OPERATIVO
**Fecha:** 2026-04-27
**Objetivo:** llegar a tiendas rapido, con calidad, usando el avance actual, cuestionandolo y reconstruyendo solo cuando sea estrategicamente necesario.

---

## 1. Principio operativo

FLOWYA debe avanzar por critical path, no por acumulacion de ideas.

Cada PR debe acercar la app a una V1 mobile-first publicable en App Store y Play Store. Todo lo que no acerque a ese objetivo debe clasificarse como Parking Lot o backlog futuro, salvo que sea P0 operativo.

Regla:

> Rapido no significa saltarse calidad. Rapido significa reducir alcance, eliminar ruido, reutilizar lo sano y reconstruir solo lo que bloquea el objetivo.

---

## 2. Objetivo V1 de tiendas

V1 debe permitir:

1. entrar a la app con shell claro;
2. explorar mapa y Search sin duplicar entidades;
3. abrir pais/ciudad/zona/lugar con identidad correcta;
4. guardar destinos/lugares;
5. crear un Flow basico desde un destino/lugar;
6. ver Passport basico con progreso/share seguro;
7. controlar cuenta, privacidad, idioma y ayuda;
8. pasar store readiness: permisos, privacidad, account deletion, UGC, estabilidad, metadata y review notes.

V1 no incluye:

- Pro tier;
- marketplace transaccional de vuelos/hoteles/SIMs;
- IA profunda;
- rankings sociales;
- memoria profunda tipo red social;
- Search total sobre todos los dominios;
- datos criticos avanzados sin fuente/frescura.

---

## 3. Estrategia: Strangler V1 Next

Usar la app actual como base estable, pero crear una superficie V1 Next controlada.

La V1 Next no busca paridad con la web actual. Busca convergencia hacia el target V1 mobile-first. Web actual queda como referencia/legacy y fuente de aprendizaje y piezas rescatables, no como producto destino. Si adaptar una pieza web hereda errores, producto autoriza reconstruirla.

### Mantener

- contratos y migraciones verificadas;
- Supabase/RLS actual;
- Explore estable mientras se construye V1 Next;
- media path-first aplicada;
- guardrails de duplicados exactos POI;
- bitacoras/OPEN_LOOPS.

### Adaptar

- `MapScreenVNext`: no seguir creciendo indefinidamente; estrangular por slices.
- `CountriesSheet`: evolucionar hacia `GeoSheet`.
- Search actual: convertir en motor inicial geo/spot y entry global.
- Account actual: adaptar a avatar/shell y store readiness.
- piezas web actuales: clasificar como conservar/adaptar/reconstruir/retirar antes de copiarlas.

### Reconstruir

Reconstruir solo si se cumple al menos una condicion:

- la pieza mezcla dominios de forma estructural;
- impide mobile-first iOS/Android;
- no puede cumplir store readiness;
- no puede cumplir privacidad/datos;
- bloquea Search/Geo canonical;
- su costo de parche supera crear superficie nueva aislada;
- genera regresiones recurrentes en flujos principales.

### Retirar

- patrones visuales one-off;
- fuentes de pais por `spots.address` como canon;
- creacion de geo como `spot`;
- gamificacion comparativa;
- paywalls manipulativos;
- planes operativos que compitan con este roadmap.

---

## 4. Critical path

### Fase 0 — Cierre canonico

**Objetivo:** mergear definicion y sistema operativo.

PR:

- `docs/product-definition/*`
- `OPEN_LOOPS`
- bitacora 398

DoD:

- documentos canonicos en carpeta unica;
- Daily Brief + Quality Guardrails definidos;
- PR Operating System listo;
- Store Readiness incluido;
- main limpio.

### Fase 1 — Shell V1 Next + Search entry

OL: `OL-GLOBAL-SHELL-SEARCH-001`

Objetivo:

- crear contenedor mobile-first bajo flag/ruta interna;
- bottom nav `Explore/Flow/Passport`;
- avatar top-left Account;
- Search top-right;
- no romper Explore actual.

No tocar:

- DB;
- pagos;
- Flow profundo;
- Passport profundo;
- marketplace;
- IA avanzada.

Gate:

- iOS/Android layout smoke;
- back/cerrar;
- safe areas;
- accessibility labels;
- Store Readiness review basica.

### Fase 2 — UI/IXD Vitrine minima

OL: `OL-V1-DESIGN-SYSTEM-SHOWCASE-001`

Objetivo:

- crear vitrina navegable de templates/componentes V1;
- shell, Search, GeoSheet, SpotSheet, Flow card, Passport KPI, Account panel;
- estados default/loading/empty/error/premium.

No tocar:

- runtime complejo;
- DB;
- datos reales.

Gate:

- UI Quality;
- IXD;
- UXW;
- Accessibility.

### Fase 3 — Geo canon + anti-duplicacion geo

OL: `OL-GEO-CANON-001`

Objetivo:

- definir/aplicar modelo geo minimo segun [`GEO_IDENTITY_DEDUP_V1.md`](../contracts/GEO_IDENTITY_DEDUP_V1.md);
- pais/region/ciudad/zona no son `spots`;
- Search geo abre ficha geo;
- diagnosticar geo duplicado como spots;
- seeds reproducibles por scope.

No tocar:

- visa/salud/emergencias profundas;
- marketplace;
- Flow profundo.

Gate:

- RLS/verificacion;
- rollback;
- no hard delete;
- no Storage SQL;
- Search no crea `spot` para geo.

### Fase 4 — Explore GeoSheets

OL: `OL-EXPLORE-GEOSHEETS-001`

Objetivo:

- GeoSheet para pais/region/ciudad/zona;
- progressive disclosure;
- Geo -> Spot -> Flow handoff;
- mapa con una intencion dominante;
- deprecacion gradual de CountriesSheet.

Gate:

- UX Behavioral;
- IXD;
- UI Quality;
- Accessibility;
- Performance mapa/sheets.

### Fase 5 — Flow foundation

OL: `OL-FLOW-FOUNDATION-001`

Objetivo:

- crear Flow basico;
- agregar destino/spot como parada;
- organizar paradas de forma simple;
- IA fuera o limitada a sugerencia no persistente si se aprueba.

Gate:

- control usuario;
- no persistir sugerencias sin confirmacion;
- offline/slow state minimo;
- Store Readiness si toca datos sensibles.

### Fase 6 — Passport foundation

OL: `OL-PASSPORT-FOUNDATION-001`

Objetivo:

- mapa/progreso basico;
- KPIs coherentes con Explore;
- share basico seguro;
- memoria minima, privada por defecto.

No tocar:

- rankings;
- red social;
- rewards complejos.

Gate:

- privacy/share review;
- gamificacion no manipulativa;
- no datos privados en share.

### Fase 7 — Account / Membership / Help

OL: `OL-ACCOUNT-MEMBERSHIP-HELP-001`

Objetivo:

- Account por avatar;
- perfil, idioma, privacidad, ayuda, soporte;
- membresia simple;
- account deletion/export route;
- restore purchases si hay IAP.

Gate:

- Store Readiness;
- Privacy/Data/AI Safety;
- UXW paywall;
- legal/support links.

### Fase 8 — Store readiness RC

OL: `OL-V1-MOBILE-STORE-READINESS-001`

Objetivo:

- release candidate iOS/Android;
- permisos;
- privacy/account deletion;
- metadata;
- screenshots;
- review notes;
- crash/performance smoke;
- QA matriz tiendas.

Gate:

- no P0/P1 abiertos;
- builds release validados;
- review notes listas;
- rollback/hotfix plan.

---

## 5. Cadencia operativa

Cada dia:

1. abrir con `FLOWYA_DAILY_OPERATING_BRIEF`;
2. invocar `FLOWYA_QUALITY_GUARDRAILS`;
3. confirmar repo/rama/ultimo commit;
4. declarar slice activo;
5. clasificar solicitud;
6. ejecutar solo micro-scope aprobado;
7. cerrar con evidencia, bitacora y estado Git.

Cada PR:

1. mapear JTBD/historia;
2. activar roles;
3. activar guardrails;
4. definir riesgo/rollback;
5. validar tests/QA;
6. actualizar docs si cambia contrato;
7. merge solo si no hay no-go;
8. no esperar Vercel salvo que reporte un bloqueo real de merge o el usuario lo pida explicitamente.

Cada semana o bloque grande:

1. revisar Parking Lot;
2. eliminar ideas no alineadas;
3. promover solo lo que desbloquea critical path;
4. revisar Store Readiness;
5. ajustar roadmap si hay evidencia nueva.

---

## 6. Regla de contencion de ideas

El usuario puede traer ideas. Codex debe clasificarlas.

| Tipo | Accion |
|---|---|
| P0 operativo | Pausar y diagnosticar. |
| Bloqueador del slice | Resolver dentro del slice. |
| Alineado | Incluir solo si no infla alcance. |
| Buena idea fuera de orden | Parking Lot. |
| Cambio estrategico | Actualizar definicion/OL antes de codigo. |

Frase de control:

```text
Esto puede ser valioso, pero no acerca el slice actual a tiendas. Lo capturo en Parking Lot y no lo ejecuto ahora.
```

---

## 7. Matriz de decision: usar, adaptar o reconstruir

| Pregunta | Si | Entonces |
|---|---|---|
| La pieza cumple contrato y no bloquea V1? | Si | Usar. |
| Cumple parcialmente pero mezcla responsabilidades? | Si | Adaptar por strangler. |
| Bloquea mobile/store/privacy/data? | Si | Reconstruir aislado. |
| Es estetica one-off sin sistema? | Si | Retirar o rehacer con UI Quality. |
| Es plan viejo sin historia del Master Plan? | Si | Archivar como evidencia. |

---

## 8. Store-first gates permanentes

Ningun slice cercano a V1 puede cerrar sin revisar:

- permisos;
- privacy policy;
- account deletion;
- UGC/report/delete;
- IAP/restore si aplica;
- support URL;
- metadata;
- crash/performance;
- accessibility;
- review notes.

Fuente: [`FLOWYA_STORE_READINESS_SYSTEM.md`](FLOWYA_STORE_READINESS_SYSTEM.md).

---

## 9. Riesgos principales

1. Sobre-disenar antes de tiendas.
2. Convertir FLOWYA en marketplace antes de companion.
3. Search global demasiado amplio demasiado pronto.
4. Rehacer todo sin strangler.
5. Gamificacion manipulativa.
6. UI inconsistente por componentes one-off.
7. Datos geo mal modelados como `spots`.
8. Store rejection por privacidad/permisos/account deletion/IAP.

Mitigacion:

- scope minimo;
- guardrails invocados;
- Store Readiness desde el inicio;
- deprecation register;
- daily classification;
- PR roles.

---

## 10. Proximo paso inmediato

1. Cerrar y mergear el paquete documental.
2. Abrir `OL-GLOBAL-SHELL-SEARCH-001`.
3. Crear shell V1 Next bajo flag/ruta interna.
4. Validar mobile-first + Store Readiness basico.
