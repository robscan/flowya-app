# PLAN_V1_WEB_FIRST_CLOSEOUT_2026-03-23

## Objetivo

Cerrar la V1 web-first más corta y estable posible desde el estado actual del repo, validando el valor real de FLOWYA sin abrir frentes que hoy no tienen base técnica suficiente.

## Principios

- respetar `SCOPE_0`
- no abrir frentes paralelos
- priorizar estabilidad
- proteger mapa/search/spot antes de expandir
- no meter features sin impacto directo en JTBD o valor premium
- asumir que **web** es la verdad operativa actual
- no vender “diario” completo antes de construir su dominio real
- cerrar primero la estructura del shell de Explore antes de estabilizarla entre viewports
- no declarar V1 web cerrada si las superficies core no son responsivas en web
- no declarar V1 cerrada sin validación mínima de seguridad y ownership
- medir retorno antes de decidir premium
- no instrumentar analytics con PII ni coordenadas exactas

## Etapas

### P0 indispensable

**Alcance**

- endurecer Explore web como experiencia principal
- cerrar el loop canónico:
  - descubrir
  - guardar
  - marcar visitado
  - crear spot faltante
  - editar
  - compartir
  - volver desde deep link sin perder contexto
- corregir contradicciones entre contratos y esquema real
- revisar y cerrar el riesgo funcional de tags sobre spots no propios
- cerrar mínimos operativos para pruebas con usuarios:
  - shell de Explore más accionable desde el primer render
  - auth actual entendible
  - privacidad básica
  - smoke QA web consistente
  - componentes web responsivos en mobile, tablet y desktop
  - validación mínima de seguridad
  - perfil/cuenta usable más allá del modal de auth

**Dependencias**

- runtime actual de Explore
- Supabase ya operativo
- contratos base actualizados

**Riesgos**

- regresiones por concentración en `MapScreenVNext`
- doc drift siga ocultando comportamientos reales
- tags fallen en escenarios de uso real

**Criterio de cierre**

- el loop principal web funciona de punta a punta sin huecos críticos
- search/map/spot/create/edit/share no rompen el contexto principal
- Explore comunica acción principal sin depender de descubrir el botón de búsqueda
- search/sheets/forms no colapsan en viewport web reales
- ownership, auth-gates y mutaciones críticas están validados
- existe una superficie básica de perfil/cuenta usable en web
- la documentación ya describe el sistema real
- se puede poner FLOWYA frente a usuarios web sin prometer diario ni tiendas

### P1 diferenciador

**Alcance**

- construir **Recordar-lite** como dominio privado sobre pins
- convertir `visited` en entrada a memoria personal, no solo en estado
- implementar la mínima unidad de recuerdo:
  - nota privada
  - fecha/estado de visita
  - opcionalmente foto privada si la base de storage queda limpia
- exponer un entry claro desde SpotSheet para esa memoria
- habilitar medición mínima de actividad y retorno para comparar `Explore` vs `Recordar`

**Dependencias**

- P0 estable
- definición explícita del modelo privado de recordar
- no reutilizar `description_short` como memoria personal
- política mínima de analytics alineada con privacidad

**Riesgos**

- mezclar contenido editorial del spot con contenido privado del usuario
- abrir un diario demasiado grande y volver a dispersar el alcance

**Criterio de cierre**

- un usuario puede marcar visitado y dejar un recuerdo privado reutilizable
- ese recuerdo reaparece luego en su experiencia web
- el valor de “volver a FLOWYA” empieza a ser acumulativo
- existe baseline mínima para medir si `Recordar-lite` aumenta retorno

### P2 monetización

**Alcance**

- definir frontera gratis/premium solo después de validar uso
- introducir gating claro y defendible
- elegir una propuesta premium centrada en memoria personal, no solo en descubrimiento

**Dependencias**

- P1 realmente usada y entendida por usuarios
- evidencia de retención o de valor recurrente
- baseline productiva de actividad y cohortes
- infraestructura de billing/paywall todavía por construir

**Riesgos**

- cobrar antes de tener un activo personal fuerte
- meter paywall y degradar la validación de V1

**Criterio de cierre**

- existe una razón premium clara y acumulable
- el usuario entiende qué obtiene pagando y qué sigue pudiendo hacer gratis
- 79 MXN/mes se puede defender con honestidad

### P3 post-V1 / tiendas

**Alcance**

- llevar el runtime real a iOS primero
- sustituir placeholders nativos de mapa/create/detail/edit
- resolver auth más robusta para distribución real
- completar privacidad, hardening y polish Apple-first

**Dependencias**

- P0 y P1 probados con usuarios web
- propuesta premium o de retención ya validada
- superficie nativa priorizada en vez de replicar deuda web sin limpiar

**Riesgos**

- intentar ir a tiendas con el estado actual placeholder
- duplicar bugs de Explore antes de modularizar lo suficiente

**Criterio de cierre**

- nativo deja de ser placeholder en las rutas core
- existe paridad mínima con el loop web principal
- App Store deja de ser una aspiración abstracta y pasa a ser una decisión operativa

## Micro-scopes sugeridos

- `MS-01` Actualizar contratos de datos/auth para que el repo tenga una sola verdad operativa.
- `MS-02` Ejecutar QA específico de Explore web: search, no-results, POI, create, edit, share, deep link.
- `MS-03` Resolver el contrato de tags: o permitir etiquetar spots guardados no propios, o limitar claramente la UI.
- `MS-04` Congelar la definición de V1 web: qué entra y qué queda fuera.
- `MS-05` Publicar política de privacidad mínima y copy de consentimiento para pruebas reales.
- `MS-06` Reestructurar el shell de Explore: input visible abajo, placeholder de invitación, perfil a la izquierda del input y filtros arriba izquierda; tap abre la búsqueda actual. Incluir prueba opcional con filtros inline superiores y pedir confirmación antes de adoptarla.
- `MS-07` Cerrar componentes responsivos web en Search, SpotSheet, CountriesSheet y flows web.
- `MS-08` Ejecutar validación mínima de seguridad: RLS, migraciones, auth-gates, ownership, geoloc y analytics.
- `MS-09` Construir perfil/cuenta robusto sobre auth actual.
- `MS-10` Diseñar `Recordar-lite` sobre `pins`, no sobre `spots`.
- `MS-11` Agregar entry de Recordar en SpotSheet solo cuando ya exista la persistencia privada.
- `MS-12` Implementar nota privada por pin visitado/guardado.
- `MS-13` Implementar una primera superficie de lectura de recuerdos dentro de Explore.
- `MS-14` Reabrir Auth solo para social login / activación, no para rediseñar perfil desde cero.
- `MS-15` Definir taxonomía mínima de actividad/retorno y disclosure de analytics sin PII.
- `MS-16` Persistir sesiones y eventos mínimos en Supabase para `Explore` y `Recordar-lite`.
- `MS-17` Construir dashboard base para comparar `explore_only`, `recordar_only` y `mixed`.
- `MS-18` Definir frontera gratis/premium recién después de uso real.
- `MS-19` Posponer native/store work hasta que el loop web y Recordar-lite estén cerrados.

Referencia operativa para shell Explore:

- [PLAN_OL_EXPLORE_RESTRUCTURE_001_2026-03-28.md](PLAN_OL_EXPLORE_RESTRUCTURE_001_2026-03-28.md) contiene el alcance del nuevo layout de Explore web.

Referencia operativa para responsividad web:

- [PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md](PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md) contiene superficies, backlog y criterios de cierre para web.

Referencia operativa para seguridad:

- [PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md](PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md) contiene el backlog mínimo de validación de seguridad y ownership.

Referencia operativa para perfil:

- [PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md](PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md) contiene el alcance de perfil/cuenta usable en web.

Referencia operativa para `MS-14` a `MS-16`:

- [PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28.md](PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28.md) contiene backlog técnico ejecutable, secuencia y DoD de actividad/retorno.

## Qué cerrar primero

1. Explore web estable
2. contratos y datos alineados a código
3. tags sin contradicción de ownership
4. privacidad y acceso real a pruebas
5. shell de Explore reestructurado
6. componentes responsivos web
7. validación mínima de seguridad
8. perfil/cuenta robusto en web
9. Recordar-lite privado
10. auth social login si sigue haciendo sentido
11. medición mínima de actividad y retorno

## Qué no tocar aún

- trips completos
- timeline de viaje
- flow/route builder
- paywall
- billing
- salida a tiendas
- expansión fuerte de gamificación
- refactor grande “por limpieza” si no desbloquea estabilidad real

## Qué puede romper estabilidad

- tocar search, map, filter y sheet al mismo tiempo
- seguir metiendo reglas nuevas dentro de `MapScreenVNext` sin aislar objetivos
- usar metadata pública del spot como sustituto de memoria privada
- prometer native readiness cuando las rutas core nativas siguen en placeholder

## Qué sí permitiría probar V1 en web con usuarios reales

- un mapa confiable
- búsqueda usable
- save/visited claros
- creación de spots faltantes sin fricción
- edición básica
- share
- tags funcionando de verdad
- shell de Explore más accionable desde el primer render
- componentes core usables en mobile web, tablet y desktop
- perfil/cuenta usable y coherente con la auth actual
- una narrativa simple del producto:
  - descubre lugares
  - guarda lo que te interesa
  - marca lo que viviste
- baseline mínima para saber si el usuario vuelve por explorar o por recordar

## Qué tendría sentido dejar para salida a tiendas

- runtime nativo real de mapa
- create/detail/edit nativos
- mejoras Apple-first de polish y performance
- social login si acelera activación
- cualquier experiencia premium madura que ya haya mostrado valor en web

## Recomendación final

Sí conviene salir primero en web, porque el producto real ya vive ahí. No conviene ir todavía a tiendas, porque la app nativa todavía no representa el producto que el repo sí implementa.

El momento sensato para pensar en App Store llega cuando ocurran dos cosas:

- Explore web ya sea estable y defendible frente a usuarios reales
- Recordar-lite ya convierta spots visitados en memoria privada acumulable

La feature que debe convertirse en columna vertebral del valor premium no es el mapa por sí solo. Debe ser **el mapa personal de recuerdos**: privado, acumulable y claramente mejor mes a mes.
