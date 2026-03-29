# OL-METRICS-001 — Proyecto métricas y telemetría

**Estado:** Planificado / Postergado estrategicamente  
**Prioridad:** Baja (no urgente)  
**Referencia:** [docs/ops/investigation/OL_SEARCHV2_002_API_INVENTORY_2026-03-09.md](../investigation/OL_SEARCHV2_002_API_INVENTORY_2026-03-09.md)

---

## 1. Investigación: buenas prácticas

### 1.1 Criterios para elegir stack de métricas

- **Eventos vs agregados:** Eventos granulares permiten análisis flexible; agregados reducen coste y complejidad.
- **Privacidad:** Minimizar PII; anonimizar o hashear identificadores; política de retención clara.
- **Coste:** Evaluar free tier y pricing por volumen esperado.
- **Integración:** SDK ligero, no bloqueante; batch/flush asíncrono para no impactar UX.
- **Ecosistema React/Expo:** Soporte web y móvil; manejo de offline/queue.

### 1.2 Opciones habituales

| Herramienta | Pros | Contras |
|-------------|------|---------|
| PostHog | Open source, self-host, product analytics | Infra adicional si self-host |
| Mixpanel | Fuerte en eventos, free tier | Límites en free |
| Supabase + tabla eventos | Control total, ya en stack | Hay que construir dashboards |
| Amplitude | Product analytics maduro | Coste a escala |

### 1.3 Buenas prácticas

1. Definir eventos canónicos (nombres, propiedades) antes de implementar.
2. No enviar PII en eventos; usar `user_id` o `session_id` anonimizado.
3. Implementar queue local para offline; flush al recuperar conexión.
4. Feature flag para habilitar/deshabilitar envío sin deploy.
5. Documentar contrato de eventos en `docs/contracts`.

---

## 2. Objetivo

Métricas y telemetría productiva: consumo de APIs externas (Mapbox, etc.), patrones de uso y comportamiento por usuario. Permitir análisis continuo y decisiones basadas en datos.

## 2.1 Decisión operativa 2026-03-28

- **Producto:** usar **Supabase** como fuente canónica de sesiones y eventos.
- **Web analytics complementaria:** usar **Vercel** solo para tráfico, páginas, referrers y performance web.
- **No** usar Vercel como fuente principal para cohortes, retorno ni comparación `Explore` vs `Recordar`.
- **Subplan detallado:** [PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28.md](PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28.md).

---

## 3. Habilitadores sugeridos

1. Definir qué eventos capturar (Mapbox, búsqueda, conversiones).
2. Elegir stack (PostHog, Mixpanel, Supabase events u otro).
3. Contrato de privacidad y retención.
4. Dashboard mínimo de agregación.
5. Integración con instrumentación existente (`lib/mapbox-api-metrics.ts`) si se decide persistir.

---

## 4. Relación con instrumentación actual

La instrumentación en `lib/mapbox-api-metrics.ts` es solo memoria (sesión). OL-METRICS-001 propone persistencia y agregación. Al retomar este proyecto, evaluar si extender esa instrumentación o usar herramienta externa como fuente de eventos.

---

## 5. Estado

Postergado estratégicamente. No ejecutar antes de estabilidad base y privacidad mínima, pero sí retomar antes de decisiones de monetización.
