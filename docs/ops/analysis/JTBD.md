# JTBD — Base (Flowya)

**Última actualización:** 2026-02-26

> Documento vivo: conforme avancemos, cuestionamos JTBD, proponemos ajustes y lo registramos en bitácora.

---

## JTBD primarios (usuario)

### JTBD-01 — Explorar map-first sin fricción

**Cuando** estoy en un lugar (ciudad/barrio) y tengo tiempo disponible,
**quiero** abrir un mapa que me muestre lugares relevantes,
**para** descubrir algo que valga mi tiempo sin planear demasiado.

**Métricas/Señales**

- Encuentro 1–3 opciones útiles en < 60s.
- No siento ruido ni desconfianza (ranking/curación).

---

### JTBD-02 — Guardar rápido (Saved)

**Cuando** veo un lugar interesante,
**quiero** guardarlo con una sola acción,
**para** poder volver después sin depender de screenshots o notas sueltas.

**Métricas/Señales**

- “Guardar” es 1 gesto.
- Puedo filtrar guardados fácilmente.

---

### JTBD-03 — Recordar lo vivido (Visited)

**Cuando** ya visité un lugar,
**quiero** marcarlo como visitado y asociar recuerdos (nota/foto),
**para** construir mi mapa personal y mi historia.

**Métricas/Señales**

- “Visited” es un estado con peso (no cosmético).
- Puedo reconstruir viajes por ciudad/ruta.

---

### JTBD-04 — Armar una ruta ligera (Flows)

**Cuando** tengo una ventana de tiempo (2h / 1 día),
**quiero** ordenar lugares guardados y sugeridos en una ruta simple,
**para** moverme con intención sin sobrepensar.

---

### JTBD-05 — Compartir recomendaciones útiles

**Cuando** alguien me pide recomendaciones,
**quiero** compartir una selección/ruta,
**para** ayudar sin escribir biblias por chat.

---

## Objetivos de sistema (no JTBD de usuario)

### S1 — UI estable, sin glitches

**Cuando** interactúo con Explore,
**quiero** transiciones suaves y layout estable (sin overlays rotos, sin white-space bugs),
**para** confiar en el producto.

### S2 — Librería limpia (Design System)

**Cuando** construimos UI nueva,
**queremos** reutilizar componentes y evitar duplicados,
**para** avanzar rápido sin crear deuda.

---

## Preguntas que debemos seguir cuestionando

- ¿“Saved” y “Visited” cubren el modelo mental o falta un matiz real?
- ¿Qué señales definen “relevancia” en Explore?
- ¿Qué evidencia necesitamos antes de invertir en Flows a fondo?

---

## Addendum propuesto (2026-02-26, pendiente de adopción)

### JTBD-06 — Decidir con confianza inmediata

**Cuando** selecciono un lugar en mapa/búsqueda,  
**quiero** entender en menos de 1 segundo qué está activo y qué puedo hacer,  
**para** avanzar sin dudas ni re-taps.

### S3 — Una sola fuente visual por intención

**Cuando** el sistema muestra selección/estado,  
**queremos** evitar señales duplicadas o competitivas,  
**para** mantener claridad, confianza y control.

### S4 — Interacciones consistentes cross-platform

**Cuando** un componente interactivo cambia de estado,  
**queremos** que el lenguaje visual sea equivalente en web y mobile,  
**para** que la experiencia se sienta coherente y premium.

### Estado de cumplimiento (resumen)

- JTBD-01: parcial.
- JTBD-02: cumplido con oportunidades.
- JTBD-03: parcial.
- S1: parcial.
- S2: parcial.
