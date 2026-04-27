# FLOWYA Product Architecture Review

**Estado:** CANONICO / REVISION CRITICA
**Fecha:** 2026-04-27
**Fuentes:** [`FLOWYA_V1_MASTER_PLAN.md`](FLOWYA_V1_MASTER_PLAN.md), [`FLOWYA_UX_BEHAVIORAL_FOUNDATION.md`](FLOWYA_UX_BEHAVIORAL_FOUNDATION.md)

---

## 1. Diagnostico ejecutivo

El sistema tiene una direccion valiosa y coherente: FLOWYA debe ser emocional, exploratorio y map-first, no una app utilitaria pura, lista de reviews o marketplace de viaje.

La arquitectura `Explore / Flow / Passport / Account` es correcta. La decision de mantener `Account` fuera del bottom nav y abrirlo por avatar superior izquierdo tambien es correcta. Search global como entry point superior derecho es una decision estrategica sana, siempre que se construya por fases.

La principal alerta: el Master Plan esta mas maduro que el documento UX Foundation. La base conductual esta bien orientada, pero todavia no tiene suficiente granularidad para gobernar todas las historias, especialmente membresias, IA, datos criticos, privacidad, offline y ejecucion durante viaje.

Veredicto:

- Aprobado como direccion.
- No aprobado aun para ejecucion grande de pantallas.
- Aprobado para endurecimiento de contratos y primer slice de shell/search bajo alcance controlado.

---

## 2. Validacion de usuario

### Lo correcto

- El core user es acertado: viajero experiencial, curioso, estetico, interesado en contexto, libertad e identidad del lugar.
- La division entre explorador curioso, planner relajado y documentador cubre la tension central de FLOWYA: descubrir, planear y recordar.
- La exclusión de turista masivo como core es sana; FLOWYA no debe competir frontalmente con Google Maps, Booking o Tripadvisor.

### Gaps

El usuario aun esta definido de forma demasiado aspiracional. Faltan perfiles situacionales:

- viajero solo;
- pareja/grupo;
- viajero internacional primerizo;
- viajero frecuente;
- viajero ansioso/overplanner;
- viajero que documenta despues, no durante;
- usuario con conectividad limitada;
- usuario con poco tiempo durante el viaje.

### Riesgo

Si no se aterrizan estos perfiles, FLOWYA puede disenarse para una version idealizada del viajero, no para momentos reales de decision, cansancio, ansiedad, mala conexion o cambios de plan.

---

## 3. Validacion JTBD

### Cobertura

Los JTBD cubren el arco principal:

- evaluar destino;
- explorar;
- guardar;
- planear;
- ejecutar;
- recordar;
- compartir;
- idioma;
- pagar por valor.

### Gaps criticos

Faltan JTBD explicitos para:

- confianza y seguridad: "puedo creer este dato?";
- cambios durante viaje: "que hago si cambia el plan?";
- presupuesto: "cuanto me puede costar?";
- colaboracion: "viajo con alguien";
- baja conectividad/offline;
- recuperar intencion: "por que guarde esto?";
- soporte/legal/permisos como confianza, no solo configuracion.

### Redundancias

Hay solapamiento entre:

- Passport progreso vs Passport memoria;
- Share identidad vs gamificacion;
- Explore guardados vs Passport visitados;
- Flow completado vs Passport recap.

Debe resolverse con ownership de dominio:

- Explore descubre y guarda.
- Flow organiza futuro/presente.
- Passport conserva pasado/identidad.
- Account controla confianza, privacidad, membresia y soporte.

---

## 4. Modelo mental geo

La jerarquia base `Pais -> Region -> Ciudad -> Spot` es correcta pero incompleta.

Jerarquia recomendada:

```text
Pais -> Region/Estado -> Ciudad -> Zona/Barrio/Area -> Spot
```

Motivo:

- En viajes reales, zonas y barrios suelen ser mas accionables que regiones administrativas.
- Ejemplos: Roma Norte, Centro Historico, Zona Hotelera, Montmartre, Condesa, Soho.
- Las zonas ayudan a decidir donde alojarse, caminar, comer, explorar y evitar saturacion del mapa.

Implicacion de modelo:

- Evaluar `geo_areas` o `geo_neighborhoods`.
- No forzar zonas a `spots`.
- Search debe entender alias de zonas.
- GeoSheet debe poder bajar de ciudad a zona antes de spot.

---

## 5. Validacion UX/UI

### Principios suficientes

Los principios actuales son buenos:

- progressive disclosure;
- context first;
- low input;
- no dead ends;
- emotional mapping.

### Principios faltantes

Agregar como no negociables:

- control del usuario sobre automatizacion;
- reversibilidad;
- privacidad visible;
- fuente y frescura para datos criticos;
- offline/low-connectivity awareness;
- un foco por pantalla;
- no shame, no pressure;
- recognition over recall.

### Conflicto detectado

El principio "fluidez > control excesivo" debe matizarse. En viajes, salud, documentos, pagos, privacidad y datos criticos, control no es friccion: es confianza.

Regla:

- Fluidez para explorar.
- Control explicito para guardar, pagar, publicar, borrar, compartir, viajar y confiar en datos sensibles.

---

## 6. GeoSheet y SpotSheet

### GeoSheet

JTBD correcto:

- "Vale la pena este destino?"
- "Que necesito entender para decidir?"
- "Como bajo de pais a ciudad/zona/lugar?"

GeoSheet no debe convertirse en lista infinita ni en enciclopedia. Debe mostrar decision-context:

- vibe/identidad;
- zonas/ciudades clave;
- mejores usos del destino;
- datos esenciales con fuente/frescura;
- lugares destacados;
- CTA guardar;
- CTA crear/agregar a Flow.

### SpotSheet

JTBD correcto:

- "Que es este lugar puntual?"
- "Lo guardo, lo visito, lo agrego a Flow o lo recuerdo?"

SpotSheet no debe absorber contexto pais/ciudad ni datos criticos territoriales. Debe enfocarse en experiencia puntual, fotos, descripcion, tags, estado personal y acciones.

### Contrato de transicion pendiente

Se requiere contrato explicito:

- Search geo -> GeoSheet, nunca POI/Spot creation.
- GeoSheet -> SpotSheet conserva back stack.
- GeoSheet -> Flow crea Flow con scope geo, no spot.
- SpotSheet -> Passport/Remember guarda memoria puntual, no cambia geo canon.

---

## 7. Mapa

El mapa es correcto como interfaz principal porque FLOWYA es exploratorio y emocional. Pero tiene alto riesgo de saturacion.

Regla:

- El mapa debe mostrar una intencion dominante por contexto.

Ejemplos:

- Explore geo: contexto territorial + lugares relevantes.
- Explore spots: pins puntuales.
- Flow: ruta/paradas del viaje.
- Passport: progreso/memoria, no descubrimiento operativo.

Riesgos:

- mostrar paises, ciudades, spots, flows, memorias y badges a la vez;
- usar mapa para todo aunque una lista/agenda sea mejor;
- hacer pin density ilegible;
- mezclar exploracion con ejecucion.

---

## 8. Behavioral Design Review

### Octalysis

Uso recomendado:

- CD2 desarrollo: progreso viajero, badges, completion real.
- CD3 empoderamiento: exploracion y decisiones editables.
- CD7 curiosidad: descubrimiento, no FOMO.
- CD5 influencia social: share voluntario, no ranking social.

Evitar:

- CD8 perdida;
- CD6 escasez manipulativa;
- streaks;
- rankings publicos;
- mensajes de culpa;
- "te falta X para ser viajero real";
- urgencia falsa;
- ofertas con presion psicologica.

### Riesgo de manipulacion

El mayor riesgo no esta en badges, sino en combinar:

- membresias;
- IA;
- datos de viaje;
- FOMO;
- share social;
- "progreso" como identidad.

Si no se regula, Passport puede volverse comparativo y ansioso. Debe ser identidad personal, no competencia.

### Reglas anti-manipulacion

1. No usar culpa, perdida o urgencia falsa.
2. No vender informacion critica de seguridad como premium.
3. No esconder privacidad detras de paywall.
4. No hacer ranking social por defecto.
5. No autopersistir decisiones importantes.
6. No compartir ubicaciones/fotos/memorias sin confirmacion clara.
7. Toda recomendacion IA debe ser editable y explicable.
8. Toda monetizacion debe estar ligada a ahorro real de tiempo, claridad o utilidad.
9. Las recompensas deben celebrar progreso real, no producir ansiedad.
10. El usuario siempre debe poder cerrar, volver, editar o deshacer.

---

## 9. Laws of UX

### Bien integradas

- Hick's Law: reducir opciones.
- Miller's Law: chunking.
- Aesthetic-Usability: UI cuidada.
- Doherty Threshold: velocidad.
- Peak-End Rule: memoria.

### Faltan

- Jakob's Law: patrones familiares para tabs, search, account.
- Fitts's Law: acciones principales alcanzables con pulgar.
- Tesler's Law: la complejidad vive en arquitectura, no desaparece.
- Goal-Gradient Effect con cuidado: progreso sin presion.
- Recognition over Recall: recientes, chips, contexto, aliases.

### Sobra o requiere cuidado

Peak-End Rule no debe usarse para manipular la memoria del viaje. Debe mejorar recaps y cierre emocional, no reescribir la experiencia.

---

## 10. Arquitectura de producto

### Separacion de dominios

Correcta:

- Explore: descubre.
- Flow: planea/ejecuta.
- Passport: recuerda/identidad.
- Account: controla.

### Overlaps a resolver

- Visitados: Explore vs Passport.
- Flow completado: Flow vs Passport.
- Perfil publico: Passport vs Account.
- Search: todos los dominios.

Regla:

- La entidad puede ser compartida; la intencion de uso decide el dominio.

Ejemplo:

- Un spot visitado se puede abrir desde Explore para consultar, desde Flow como parada, y desde Passport como recuerdo.

---

## 11. Search global

Search global es correcto como entry point, pero peligroso si V1 intenta buscar todo.

Fases recomendadas:

1. Geo + spots.
2. Flows.
3. Passport/memories.
4. Account/help.

Riesgos:

- privacidad de recuerdos;
- resultados mezclados sin jerarquia;
- costos API;
- confusion entre buscar y crear;
- falsas coincidencias geo;
- resultados premium que parecen bloqueos arbitrarios.

Regla:

- Search puede ser global desde el shell, pero el motor debe crecer por dominios verificados.

---

## 12. Sobre-diseno, sub-definicion y simplificacion V1

### Sobre-disenado para V1

- Pro tier.
- vuelos/hoteles/SIMs transaccionales.
- Search global sobre todos los dominios desde el inicio.
- Design System Showcase perfecta si bloquea producto.
- contexto completo de visa/salud/dinero/clima/emergencias.
- IA profunda/persistente.

### Sub-definido

- usuario real en situaciones de friccion;
- contenido exacto de GeoSheet;
- fuentes/frescura de datos;
- limites de IA;
- membresias Free/Plus;
- Passport memoria privada vs identidad compartible;
- offline;
- colaboracion;
- soporte en viaje.

### Decisiones peligrosas a largo plazo

- convertir FLOWYA en marketplace antes de companion;
- gamificar paises como acumulacion;
- hardcodear facts criticos sin governance;
- Search global sin geo canon;
- reconstruccion sin flags ni deprecation register;
- paywalls sobre confianza, seguridad o privacidad.

### Simplificar V1

Mantener:

- shell V1;
- Search geo/spot;
- geo canon;
- GeoSheet/SpotSheet;
- Flow basico;
- Passport basico;
- Account/membresia simple;
- share basico;
- gamificacion no comparativa.

Posponer:

- Pro;
- vuelos/hoteles/SIMs transaccionales;
- memories profundas;
- IA avanzada;
- rankings;
- contexto critico avanzado sin fuentes;
- Search sobre todos los dominios.

---

## 13. Ajustes requeridos al modelo

Agregar o evaluar:

- `geo_areas` / `geo_neighborhoods`;
- `geo_aliases`;
- `geo_sources`;
- `geo_context_entries.source_quality`;
- `user_geo_marks.status` (`interested | planned | visited`);
- `flow_stops` referenciando `geo_scope` o `spot`;
- Passport/memories separados de `spots`.

No hacer:

- pais/region/ciudad como `spots`;
- visa/salud/emergencias como columnas de `spots`;
- privacidad por foto como parche sobre portada publica;
- tags personales como columnas de `spots`.

---

## 14. Validacion final

El sistema es coherente y valioso, pero necesita limites antes de ejecucion grande.

Aprobado para:

- ordenar definicion canonica;
- crear shell V1 Next bajo flag;
- introducir Search global como entry point visual;
- ejecutar geo canon antes de GeoSheets profundas.

No aprobado aun para:

- marketplace;
- Pro tier;
- IA profunda;
- Search total;
- datos criticos avanzados sin fuente;
- reconstruccion sin strangler y deprecation register.
