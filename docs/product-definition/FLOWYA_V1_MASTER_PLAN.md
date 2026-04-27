# FLOWYA V1 MASTER PLAN

**Estado:** CANONICO / EN DEFINICION EJECUTIVA
**Fecha:** 2026-04-27
**Owner operativo:** FLOWYA + Codex
**Uso:** plan maestro unico para convertir los planes existentes en slices ejecutables, no en direcciones paralelas.
**Fuentes complementarias:** [`FLOWYA_OPERATIONAL_ROADMAP.md`](FLOWYA_OPERATIONAL_ROADMAP.md), [`FLOWYA_QUALITY_GUARDRAILS.md`](FLOWYA_QUALITY_GUARDRAILS.md), [`FLOWYA_UX_BEHAVIORAL_FOUNDATION.md`](FLOWYA_UX_BEHAVIORAL_FOUNDATION.md), [`FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md`](FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md), [`FLOWYA_PR_OPERATING_SYSTEM.md`](FLOWYA_PR_OPERATING_SYSTEM.md), [`FLOWYA_STORE_READINESS_SYSTEM.md`](FLOWYA_STORE_READINESS_SYSTEM.md).

---

## 1. North Star

FLOWYA debe ser la app mobile-first preferida para planear, ejecutar y recordar viajes. La app debe querer, cuidar y pensar en el usuario: reducir incertidumbre, ordenar decisiones, proteger privacidad, evitar duplicados, explicar fuentes y ofrecer herramientas reales para viajar mejor.

La version V1 debe ser simple, clara y consultable, pero no superficial. La complejidad debe vivir en el modelo, en la orquestacion y en la progressive disclosure; la interfaz debe sentirse tranquila, util y segura.

### Promesa de producto

FLOWYA ayuda al usuario a:

1. descubrir paises, regiones, ciudades y lugares;
2. decidir si un destino merece su atencion;
3. convertir intereses en planes accionables;
4. ejecutar el viaje con menos friccion;
5. recordar y compartir su historia viajera;
6. desbloquear herramientas premium mediante membresias claras.

### Principios no negociables

- Mobile first para App Store y Play Store; web acompana y valida, pero no dicta V1.
- Bottom nav canonico: `Explore`, `Flow`, `Passport`.
- `Account` no es tab: entra por avatar superior izquierdo.
- Search global es un entry point de primer nivel: extremo superior derecho.
- Paises, regiones y ciudades no son `spots`.
- `spots` no es contenedor universal de viaje.
- Los datos criticos deben tener fuente, fecha y frescura.
- APIs en tiempo real son apoyo, no dependencia para abrir las fichas base.
- La UI debe dar control: back claro, cierre claro, contexto visible y navegacion reversible.
- Recompensas y gamificacion deben reforzar progreso real, no distraer de viajar.
- El producto no debe usar culpa, perdida, urgencia falsa, rankings publicos por defecto ni escasez manipulativa.

---

## 2. Opinion directiva sobre reconstruccion

La recomendacion es ejecutar una reconstruccion estrategica por strangler, no una reescritura total a ciegas.

### Que significa "reconstruir" aqui

Crear una nueva arquitectura de superficie y dominios V1, mobile-first, que conviva temporalmente con Explore actual hasta alcanzar paridad operacional. La pantalla actual puede seguir sirviendo como base estable mientras se construyen y validan las nuevas piezas.

### Que NO significa

- No borrar la pantalla actual antes de tener reemplazo probado.
- No abandonar contratos, migraciones, RLS ni datos existentes.
- No duplicar logica critica sin plan de retiro.
- No rehacer por estetica si el problema es contrato/modelo.
- No crear dos productos permanentes.

### Estrategia recomendada

1. **Definir contratos V1.** Shell, dominios, entidades, Search, membresias, seguridad, i18n y release gates.
2. **Crear superficie V1 Next aislada.** Feature flag / ruta interna / entry controlado. Mobile primero.
3. **Construir por dominio.** Shell -> Search -> Geo -> Explore -> Flow -> Passport -> Account.
4. **Medir paridad y calidad.** Cada slice tiene historias, criterios de aceptacion, pruebas y rollback.
5. **Deprecar con inventario.** Cada componente viejo se marca como conservar, adaptar, sustituir o retirar.
6. **Cortar cuando V1 Next gane.** Solo al cumplir release gates mobile, datos y UX.

### Por que esta ruta es correcta

El bug de duplicados geo/POI no es solo un bug: muestra que el modelo actual mezcla intenciones distintas. Parchar todo sobre `MapScreenVNext` puede sostener el producto un tiempo, pero no es base sana para `Flow`, `Passport`, membresias ni datos territoriales robustos.

---

## 3. Shell canonico V1

### Mobile

Estructura persistente:

- Top left: avatar -> `Account`.
- Top right: Search global.
- Bottom nav: `Explore`, `Flow`, `Passport`.
- Centro: dominio activo.
- Sheets: profundidad contextual, no navegacion global.

Reglas:

- El avatar siempre abre control personal, membresia, privacidad, idioma, ayuda y configuracion.
- Search siempre esta disponible salvo overlays bloqueantes o estados de captura que lo justifiquen.
- Bottom nav no debe abrir modales; cambia dominios.
- El dominio activo conserva estado cuando el usuario salta de tab, salvo cierre explicito.

### Web

Web debe respetar la arquitectura, pero puede adaptar layout:

- Explore: mapa + sidebar.
- Flow: workspace de itinerario.
- Passport: dashboard personal y memoria.
- Account: panel o ruta embebida.
- Search: overlay/command center global.

Web no debe volver a imponer decisiones mobile-incompatibles.

---

## 4. Dominios de producto

### 4.1 Explore

**Proposito:** descubrir, consultar y guardar destinos/lugares.

Responsabilidades:

- mapa;
- busqueda;
- fichas de pais, region, ciudad, zona/barrio y spot;
- guardados y visitados;
- filtros;
- contexto territorial;
- fotos publicas/personales en lugares;
- puente a Flow y Passport.

No responsabilidades:

- itinerarios completos;
- vuelos/hoteles/transporte como booking activo;
- diario profundo;
- membresia;
- configuracion.

Entidades principales:

- `geo_countries`
- `geo_regions`
- `geo_cities`
- `geo_areas`
- `geo_context_entries`
- `spots`
- `pins`
- `spot_images`
- `spot_personal_images`
- `user_tags`
- `pin_tags`
- `user_geo_marks`

### 4.2 Flow

**Proposito:** planear y ejecutar viajes.

Responsabilidades:

- viajes/flows;
- dias;
- paradas;
- vuelos;
- hoteles;
- transporte;
- SIMs/eSIMs;
- reservas;
- checklist;
- asistencia IA;
- ejecucion durante viaje;
- handoff desde Explore.

No responsabilidades:

- descubrir mundo desde cero;
- consolidar memoria historica;
- editar datos territoriales canonicos;
- gestionar privacidad/account.

Entidades futuras:

- `flows`
- `flow_days`
- `flow_stops`
- `flow_segments`
- `flow_bookings`
- `flow_documents`
- `flow_checklist_items`
- `flow_ai_sessions`
- `flow_membership_features`

### 4.3 Passport

**Proposito:** identidad viajera, progreso, memoria y recompensas.

`Passport` es mejor nombre de bottom nav que `Remember` porque agrupa progreso, mapa personal, recuerdos y compartir. `Remember` puede vivir dentro como seccion de memoria.

Responsabilidades:

- paises visitados;
- ciudades/regiones visitadas;
- mapa personal;
- KPIs;
- flows completados;
- memorias;
- fotos personales;
- notas;
- colecciones;
- logros/recompensas;
- share cards.

No responsabilidades:

- planear viajes futuros;
- buscar proveedores;
- editar identidad/account;
- descubrir destinos nuevos como flujo principal.

Entidades futuras:

- `user_geo_marks`
- `memories`
- `journal_entries`
- `passport_badges`
- `passport_share_cards`
- `flow_recaps`
- `visited_snapshots`

### 4.4 Account

**Proposito:** control, confianza, soporte y monetizacion.

Account no es tab. Entra por avatar.

Responsabilidades:

- perfil;
- auth;
- membresia;
- idioma;
- privacidad;
- permisos;
- ayuda;
- feedback;
- legal;
- soporte;
- exportar datos;
- eliminar cuenta/contenido;
- preferencias.

Entidades:

- `profiles`
- `membership_subscriptions`
- `membership_entitlements`
- `user_preferences`
- `support_requests`
- `feedback`
- consentimientos/fotos.

---

## 5. Search global

Search debe convertirse en una pieza transversal, no solo `Buscar spots`.

### Entry point

- Ubicacion: extremo superior derecho del shell.
- Icono/search pill segun espacio.
- Accesible en `Explore`, `Flow` y `Passport`.
- En `Account`, puede buscar settings/help si la superficie lo permite.

### Alcance V1

Search debe encontrar:

- paises;
- regiones;
- ciudades;
- zonas/barrios/areas;
- spots;
- tags;
- flows;
- recuerdos basicos;
- configuracion/help.

### Idiomas

Debe tolerar:

- nombres en varios idiomas;
- acentos;
- alias comunes;
- abreviaturas;
- typos leves;
- nombres locales y nombres internacionales.

Ejemplos:

- `Mexico`, `México`, `Mexique`;
- `CDMX`, `Mexico City`, `Ciudad de Mexico`;
- `Holbox`, `Isla Holbox`.

### Comportamiento por dominio

- En Explore: abre ficha geo o spot.
- En Flow: agrega destino/parada o busca dentro del viaje.
- En Passport: encuentra viaje, memoria, pais, ciudad o lugar visitado.
- En Account: encuentra setting/help/legal.

### Guardrail critico

Seleccionar un pais, region o ciudad desde Search nunca debe crear un `spot`. Debe abrir una ficha geo canonica o, si no existe aun, una ficha geo transitoria no persistida hasta accion explicita.

---

## 6. Modelo de informacion V1

### Separacion canonica

| Tipo | Tabla/canon | Relacion usuario | UI principal |
|---|---|---|---|
| Pais | `geo_countries` | `user_geo_marks` | GeoSheet / Passport |
| Region | `geo_regions` | `user_geo_marks` | GeoSheet |
| Ciudad | `geo_cities` | `user_geo_marks` | GeoSheet |
| Zona/Barrio/Area | `geo_areas` | `user_geo_marks` | GeoSheet |
| Lugar puntual | `spots` | `pins` | SpotSheet |
| Plan | `flows` | owner | Flow |
| Parada | `flow_stops` | owner | Flow |
| Recuerdo | `memories` / `journal_entries` | owner | Passport |
| Perfil | `profiles` | owner | Account |

### `spots`

Debe mantenerse como tabla caliente:

- titulo;
- descripcion corta/larga;
- coordenadas;
- owner;
- visibilidad;
- linking externo;
- portada/cache;
- contexto geo minimo si se aprueba.

No debe recibir:

- visa;
- transporte;
- salud;
- dinero;
- clima;
- emergencias;
- vuelos;
- hoteles;
- itinerarios;
- memorias profundas;
- tags personales como columnas;
- privacidad por foto como parche.

### Geo

Debe ser batch-first:

- paises seed completos;
- regiones por pais con criterio versionado;
- ciudades principales por alcance;
- zonas/barrios principales por ciudad cuando sean utiles para decidir y moverse;
- contexto por categoria, fuente y frescura;
- alias multilenguaje;
- bbox/geometria para encuadre.

### Membership

Membresias deben ser entitlements, no `if premium` disperso.

Conceptos:

- `membership_plans`
- `membership_entitlements`
- `user_memberships`
- feature gates por capacidad.

---

## 7. Jobs To Be Done

### JTBD-01 Descubrir destino

Cuando estoy considerando viajar a un pais, region, ciudad o zona, quiero entender rapido que ofrece y que debo saber, para decidir si lo guardo o lo uso en un plan.

Historias:

- Como viajero, quiero buscar un pais por nombre en mi idioma para abrir su ficha sin crear duplicados.
- Como viajero, quiero ver un resumen de valor del destino para decidir si sigo explorando.
- Como viajero, quiero ver regiones, ciudades, zonas y lugares principales para bajar de nivel sin perder contexto.
- Como viajero, quiero guardar un pais/ciudad de forma explicita para retomarlo despues.
- Como viajero, quiero saber cuando la informacion fue actualizada para confiar en datos importantes.

Criterios:

- Search abre ficha geo, no POI.
- Guardar pais usa `user_geo_marks`, no `spots`.
- La ficha muestra fuente/frescura en datos sensibles.

### JTBD-02 Guardar sin duplicados

Cuando encuentro un destino o lugar interesante, quiero guardarlo una sola vez y reconocerlo al volver, para no ensuciar mis listas ni mis planes.

Historias:

- Como usuario, quiero que seleccionar de nuevo un pais guardado abra su ficha existente.
- Como usuario, quiero que seleccionar de nuevo un spot existente abra el spot, no cree otro.
- Como usuario, quiero distinguir pais/ciudad/region/lugar antes de guardar.
- Como usuario, quiero cambiar un item entre por visitar y visitado sin duplicarlo.

Criterios:

- Unique constraints por usuario/scope.
- Runtime locks para creaciones concurrentes.
- Dedupe por identidad canonica antes de insert.

### JTBD-03 Planear viaje

Cuando quiero armar un viaje, quiero convertir destinos y lugares en un plan accionable, para saber dias, paradas, traslados y pendientes.

Historias:

- Como viajero, quiero crear un Flow desde un pais o ciudad guardada.
- Como viajero, quiero agregar spots como paradas.
- Como viajero, quiero organizar paradas por dia.
- Como viajero, quiero registrar vuelo, hospedaje y transporte.
- Como viajero, quiero que la IA proponga un itinerario editable.
- Como viajero, quiero ver que falta reservar o decidir.

Criterios:

- Flow consume geo/spots; no los duplica.
- Toda sugerencia IA es editable.
- El usuario controla confirmacion y persistencia.

### JTBD-04 Ejecutar viaje

Cuando estoy viajando, quiero consultar lo importante sin friccion, para moverme y tomar decisiones sin perder tiempo.

Historias:

- Como viajero, quiero ver mi dia actual y proximas paradas.
- Como viajero, quiero abrir direccion/mapa de una parada.
- Como viajero, quiero consultar documentos/reservas.
- Como viajero, quiero ver tips clave del destino offline-friendly cuando sea posible.
- Como viajero, quiero marcar una parada como completada o visitada.

Criterios:

- Flow tiene modo ejecucion.
- Las acciones frecuentes son de uno o dos taps.
- No depende de APIs externas para mostrar plan guardado.

### JTBD-05 Recordar viaje

Cuando termino o recuerdo un viaje, quiero consolidar lugares, fotos y notas, para preservar mi historia viajera.

Historias:

- Como viajero, quiero ver mis paises y ciudades visitadas en Passport.
- Como viajero, quiero agregar notas/fotos privadas a lugares visitados.
- Como viajero, quiero generar recap de un Flow completado.
- Como viajero, quiero encontrar recuerdos por viaje, pais, ciudad o lugar.
- Como viajero, quiero decidir que compartir y que mantener privado.

Criterios:

- Passport diferencia progreso publico/compartible de memoria privada.
- Fotos privadas nunca se publican como portada sin consentimiento.
- Recaps no alteran `spots`.

### JTBD-06 Compartir identidad viajera

Cuando quiero compartir mi progreso, quiero una visual elegante y confiable de mis viajes, para expresar mi identidad.

Historias:

- Como usuario, quiero compartir mapa de paises visitados.
- Como usuario, quiero compartir KPIs de lugares, paises y flows.
- Como usuario, quiero desbloquear badges por progreso real.
- Como usuario, quiero controlar si el share incluye fotos, ubicaciones o solo estadisticas.

Criterios:

- Share cards son reproducibles.
- No filtran datos privados.
- Gamificacion se basa en eventos verificables.

### JTBD-07 Usar en varios idiomas

Cuando busco o leo sobre un destino, quiero que FLOWYA entienda nombres y contenido en varios idiomas, para no depender de escribirlo perfecto.

Historias:

- Como usuario, quiero buscar por nombre local o internacional.
- Como usuario, quiero cambiar idioma de UI.
- Como usuario, quiero ver nombres canonicos localizados cuando existan.
- Como usuario, quiero que aliases no creen duplicados.

Criterios:

- Alias geo multilenguaje.
- Locale centralizado.
- Search tolera acentos y variantes.

### JTBD-08 Pagar por valor real

Cuando compro una membresia, quiero recibir capacidades claramente superiores, para sentir que FLOWYA me ahorro tiempo, errores y esfuerzo.

Historias:

- Como usuario gratis, quiero entender que puedo hacer sin pagar.
- Como usuario Plus, quiero usar IA para planear Flow.
- Como usuario Plus, quiero contexto avanzado de destino.
- Como usuario Pro, quiero herramientas de ejecucion/servicios mas profundos.
- Como usuario, quiero administrar mi plan desde Account.

Criterios:

- Paywall explica valor, no bloquea de forma confusa.
- Entitlements se evalúan centralmente.
- No se pierden datos al cambiar plan.

---

## 8. Historias de usuario por dominio

### Explore

| ID | Historia | Prioridad | Aceptacion |
|---|---|---:|---|
| EXP-01 | Como usuario quiero abrir Search global desde arriba derecha para encontrar paises, ciudades y lugares. | P0 | Search visible en shell; no depende del sheet activo. |
| EXP-02 | Como usuario quiero que un pais seleccionado abra GeoSheet. | P0 | No crea `spot`; back/cerrar claros. |
| EXP-03 | Como usuario quiero guardar un pais/ciudad/region. | P0 | Persiste en `user_geo_marks`; unique por usuario/scope. |
| EXP-04 | Como usuario quiero ver lugares dentro de un pais. | P0 | Lista se filtra por geo canonica o fallback explicitado. |
| EXP-05 | Como usuario quiero guardar/visitar un spot sin duplicados. | P0 | Match por `linked_place_id`/proximidad/nombre y locks. |
| EXP-06 | Como usuario quiero ver datos utiles del destino por secciones. | P1 | Progressive disclosure en `peek/medium/expanded`. |
| EXP-07 | Como usuario quiero mandar un destino a Flow. | P1 | CTA crea/inicia Flow con scope correcto. |

### Flow

| ID | Historia | Prioridad | Aceptacion |
|---|---|---:|---|
| FLO-01 | Como usuario quiero crear un Flow desde cero. | P0 | Nombre, fechas opcionales, destino opcional. |
| FLO-02 | Como usuario quiero crear Flow desde pais/ciudad/spot. | P0 | Handoff conserva scope y no duplica entidad. |
| FLO-03 | Como usuario quiero agregar paradas. | P0 | `flow_stops` referencia spot o geo/transient item. |
| FLO-04 | Como usuario quiero organizar por dias. | P1 | Drag/reorden o acciones simples mobile. |
| FLO-05 | Como usuario quiero registrar vuelo/hotel/transporte. | P1 | Entidades separadas, no `spots`. |
| FLO-06 | Como usuario quiero ayuda IA editable. | P1 | Sugerencias no persisten sin confirmacion. |
| FLO-07 | Como usuario quiero modo viaje. | P2 | Dia actual, proximas paradas, documentos. |

### Passport

| ID | Historia | Prioridad | Aceptacion |
|---|---|---:|---|
| PAS-01 | Como usuario quiero ver mi mapa de paises visitados. | P0 | Usa `user_geo_marks` y/o pins visitados migrados. |
| PAS-02 | Como usuario quiero ver KPIs de paises, lugares y flows. | P0 | Conteos consistentes con Explore. |
| PAS-03 | Como usuario quiero ver mis recuerdos por destino. | P1 | Memorias privadas por scope/spot/flow. |
| PAS-04 | Como usuario quiero compartir progreso. | P1 | Share card sin datos privados. |
| PAS-05 | Como usuario quiero badges/recompensas. | P1 | Basadas en eventos verificables. |
| PAS-06 | Como usuario quiero recaps de viajes. | P2 | Flow completado genera recap editable. |

### Account

| ID | Historia | Prioridad | Aceptacion |
|---|---|---:|---|
| ACC-01 | Como usuario quiero abrir Account desde avatar. | P0 | Avatar superior izquierdo; no bottom tab. |
| ACC-02 | Como usuario quiero administrar membresia. | P0 | Plan actual, upgrade/downgrade, entitlements. |
| ACC-03 | Como usuario quiero cambiar idioma. | P0 | UI y Search respetan locale cuando aplica. |
| ACC-04 | Como usuario quiero configurar privacidad de fotos. | P0 | Consentimiento claro publico/privado. |
| ACC-05 | Como usuario quiero ayuda y soporte. | P1 | Help consultable, feedback/contacto. |
| ACC-06 | Como usuario quiero exportar/eliminar datos. | P1 | Ruta documentada y segura. |

### Platform / Release

| ID | Historia | Prioridad | Aceptacion |
|---|---|---:|---|
| REL-01 | Como equipo quiero validar iOS y Android primero. | P0 | Build/test mobile antes de cerrar V1. |
| REL-02 | Como equipo quiero permisos claros. | P0 | Fotos/ubicacion/auth con copy App Store/Play Store. |
| REL-03 | Como equipo quiero observabilidad minima. | P0 | Errores P0, version app/build, eventos criticos. |
| REL-04 | Como equipo quiero rollout seguro. | P0 | Feature flags, rollback y deprecation register. |

---

## 9. Membresias y entitlements

### Free

- Explore base.
- Guardar lugares/spots basicos.
- Passport basico.
- Search limitado pero util.
- Share basico.

### Plus

- Flows con IA.
- Contexto avanzado de destino.
- Itinerarios enriquecidos.
- Mas memoria/fotos.
- Share premium.
- Checklists y recomendaciones.

### Pro

Pro queda fuera de V1 hasta validar que Plus genera valor real sin presion ni complejidad innecesaria. Las capacidades Pro son backlog futuro, no alcance de ejecucion V1.

### Regla de implementacion

Toda funcionalidad premium debe mapear a un entitlement. Evitar condicionales dispersos por plan.

---

## 10. Vitrina y sistema de diseno

Se debe reconstruir una vitrina nueva, navegable e impecable, como herramienta de producto y QA.

Nombre recomendado: `Flowya Design System Showcase`.

Debe incluir:

- shell mobile V1;
- bottom nav;
- top avatar/search;
- GeoSheet;
- SpotSheet;
- Flow cards;
- Passport KPIs;
- Account/settings/help;
- empty states;
- loading/error/offline;
- paywalls;
- share cards;
- estados premium/free;
- dark/light si aplica;
- iOS/Android snapshots.

Reglas:

- La vitrina no es marketing.
- La vitrina debe probar componentes reales o wrappers cercanos a runtime.
- Cada componente debe declarar estados: default, loading, empty, error, disabled, premium.
- Ningun nuevo patron visual entra a app sin pasar por vitrina o contrato equivalente.

---

## 11. Deprecation register

Todo elemento existente queda en una de estas categorias antes de migrar:

| Categoria | Significado |
|---|---|
| Conservar | Es sano y debe sobrevivir V1 Next. |
| Adaptar | La idea sirve, la implementacion necesita contrato nuevo. |
| Sustituir | Se reemplaza por nuevo componente/flujo. |
| Retirar | No debe llegar a V1 Next. |
| Investigar | Falta evidencia antes de decidir. |

Candidatos iniciales:

- `MapScreenVNext`: adaptar / estrangular, no seguir creciendo indefinidamente.
- `CountriesSheet`: adaptar hacia `GeoSheet`.
- Search actual: adaptar hacia Search global.
- Account web embebido: adaptar a avatar/shell.
- `spots.address` como fuente de pais: sustituir por geo canonico.
- planes dispersos: conservar como evidencia, sustituir como direccion por este plan maestro.

---

## 11.1 Limites V1 tras revision critica

V1 debe resistir sobre-diseno. Queda fuera del alcance inmediato:

- Pro tier;
- vuelos/hoteles/SIMs transaccionales;
- rankings sociales;
- IA profunda/persistente;
- memoria profunda tipo red social;
- Search total sobre todos los dominios;
- contexto critico avanzado sin fuentes verificadas;
- monetizacion basada en urgencia, perdida o ansiedad.

Queda dentro del alcance V1:

- shell V1;
- Search geo/spot como primer motor;
- geo canon;
- GeoSheet y SpotSheet con responsabilidades separadas;
- Flow basico;
- Passport basico;
- Account/membresia simple;
- share basico;
- gamificacion no comparativa.

---

## 12. Integracion de planes actuales

Este plan no borra historia. Reordena autoridad.

### Plan maestro

- `FLOWYA_V1_MASTER_PLAN.md` gobierna vision, dominios, shell, JTBD, historias, secuencia y gates.

### Planes existentes

Los planes existentes pasan a ser:

- evidencia historica;
- subplanes tecnicos;
- insumos de slices;
- contratos especificos si siguen vigentes.

Ningun OL futuro debe ejecutarse solo porque exista un plan viejo. Debe mapear a una historia/slice del plan maestro.

### Planes que se absorben

- Data model/media/geo -> slices `GEO`, `DATA`, `MEDIA`.
- Explore sheets/search -> slices `SHELL`, `SEARCH`, `EXPLORE`.
- Content/Recordar -> `PASSPORT`.
- Profile/auth/privacy -> `ACCOUNT`.
- Metrics/gamification/share -> `PASSPORT` + `RELEASE`.
- Climate/i18n -> `GEO_CONTEXT` + `I18N`.

---

## 13. Secuencia ejecutiva

### Fase 0: Canon estrategico

OL propuesto: `OL-FLOWYA-MASTER-PLAN-001`

DoD:

- plan maestro creado;
- OPEN_LOOPS apunta al plan maestro;
- backlog anterior reclasificado como slices;
- historias P0/P1 visibles;
- decision sobre reconstruccion documentada.

### Fase 1: Shell V1 Next

OL: `OL-GLOBAL-SHELL-SEARCH-001`

Alcance:

- bottom nav `Explore/Flow/Passport`;
- avatar top-left -> Account;
- search top-right;
- feature flag o ruta interna;
- mobile-first iOS/Android.

No alcance:

- reconstruir todos los dominios;
- migraciones DB;
- pagos reales.

### Fase 2: Geo canon

OL: `OL-GEO-CANON-001`

Alcance:

- modelo geo;
- pais/region/ciudad como entidades;
- no crear spots para geo;
- diagnostic de duplicados geo como spots;
- seeds reproducibles.

### Fase 3: Explore GeoSheets

OL: `OL-EXPLORE-GEO-SHEETS-001`

Alcance:

- GeoSheet;
- progressive disclosure;
- handoff a Flow;
- filtros y mapas por scope;
- deprecacion gradual de CountriesSheet.

### Fase 4: Flow foundation

OL: `OL-FLOW-FOUNDATION-001`

Alcance:

- flows;
- dias;
- paradas;
- handoff desde Explore;
- modelo basico IA-ready.

### Fase 5: Passport foundation

OL: `OL-PASSPORT-FOUNDATION-001`

Alcance:

- progreso;
- memorias basicas;
- share;
- gamificacion inicial.

### Fase 6: Account / Membership / Help

OL: `OL-ACCOUNT-MEMBERSHIP-HELP-001`

Alcance:

- membresias/entitlements;
- settings;
- idioma;
- privacidad;
- help/support.

### Fase 7: Release hardening

OL: `OL-V1-MOBILE-STORE-READINESS-001`

Alcance:

- iOS/Android builds;
- permisos;
- legal;
- observabilidad;
- performance;
- rollback;
- QA matrix.

---

## 14. Gates de calidad por PR

Cada PR debe declarar:

- historia(s) cubiertas;
- contrato tocado;
- riesgo;
- rollback;
- pruebas;
- que no toca.

Además, todo PR debe usar los roles y prompts aplicables definidos en [`FLOWYA_PR_OPERATING_SYSTEM.md`](FLOWYA_PR_OPERATING_SYSTEM.md).

Para codigo mobile:

- validar iOS y Android si el cambio toca runtime movil;
- evitar patrones web-only;
- medir estados lentos/offline cuando aplique;
- revisar permisos y privacidad.

Para DB:

- introspeccion antes;
- migracion aditiva cuando sea posible;
- backup si hay data move;
- RLS verificada;
- no hard delete sin aprobacion explicita;
- no Storage delete por SQL.

Para UI:

- pasar por vitrina o contrato visual;
- estados loading/empty/error;
- accesibilidad basica;
- texto no se solapa;
- no introducir patrones visuales paralelos.

---

## 15. Decisiones abiertas

1. Nombre final del tercer tab: se adopta `Passport` para V1 salvo decision contraria.
2. Nombre comercial de membresias: Free/Plus/Pro son placeholders.
3. Alcance de IA en V1: definir limites de costo, safety y persistencia.
4. Fuentes geo/context: definir licencia, frescura y proceso de actualizacion.
5. Web V1: definir si sale como companion completo o preview controlada.
6. Pagos: proveedor, paises objetivo, App Store/Play Store compliance.
7. Offline: definir minimo para Flow y fichas guardadas.

---

## 16. Criterio de exito V1

FLOWYA V1 esta lista cuando:

- el usuario puede descubrir un destino sin duplicar entidades;
- puede guardar pais/ciudad/lugar con identidad correcta;
- puede crear un Flow util desde Explore;
- puede consultar un plan en viaje;
- puede ver Passport con progreso y recuerdos;
- puede administrar cuenta/membresia/privacidad;
- Search global encuentra lo importante;
- iOS y Android pasan release gates;
- privacidad y datos criticos estan protegidos;
- el sistema tiene un plan de deprecacion claro para lo viejo.
