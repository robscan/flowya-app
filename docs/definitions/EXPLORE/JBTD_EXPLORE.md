# JBTD — EXPLORE (Planear) — Flowya

## Job principal

Cuando estoy explorando el mapa, quiero guardar lugares rápidamente para construir mi mapa personal de lugares por visitar (y opcionalmente marcar visitados), sin sentir que “salí del mapa”.

## Situaciones clave

1. Estoy planeando un viaje lejos (p. ej. busco España desde México).
2. Me recomendaron un lugar y solo quiero guardarlo, aunque no sepa nada aún.
3. Veo algo en el mapa y lo marco con long-press.
4. Busco algo, no lo encuentro, pero quiero guardarlo “aquí”.
5. Quiero marcar como visitado algo que ya estuve, sin llenar un formulario largo.

## Resultado esperado (Outcomes)

- Guardar un spot en < 10 segundos (nombre + estado + ubicación).
- Mapa siempre visible como contexto (no pantallas blancas).
- No pedir el nombre dos veces.
- Defaults correctos de estado: Por visitar / Visitado según contexto.
- Cambiar ubicación es opcional y controlado (no “me manda a otro lugar”).
- Sin empalmes: teclado / overlays / controles flotantes deben obedecer reglas.

## No objetivos (por ahora)

- Flows (tours) creados con IA.
- Sección Recordar como feed/fotos protagonista.
- Recomendaciones avanzadas por intereses.
- Reverse geocoding continuo en apertura (solo cuando se guarda, si se usa).

## Principios de diseño (Explore)

- Mapa es la pantalla. Las herramientas viven sobre él.
- Guardar primero, enriquecer después.
- Un CTA principal por estado.
- “Baja fricción” > “ficha completa”.
