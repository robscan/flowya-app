# FLOWYA Accessibility System

**Estado:** CANONICO / ACCESIBILIDAD
**Fecha:** 2026-04-27

---

## 1. Proposito

FLOWYA debe ser usable en mobile real: dedos, luz exterior, movimiento, idioma, conexiones lentas, lectores de pantalla y usuarios cansados durante viaje.

Accesibilidad aqui no es solo compliance. Es claridad, control y confianza.

---

## 2. Reglas base

- Todo icon-only button requiere label accesible.
- Targets tactiles deben ser comodos para pulgar.
- Contraste suficiente en texto, controles y mapas.
- Texto no debe cortarse en pantallas pequenas.
- Dynamic type / font scaling no debe romper controles criticos.
- Focus/back/cerrar debe ser claro.
- Modales y sheets deben manejar foco y escape/back.
- No depender solo de color para estados.
- Reduced motion debe ser respetado.

---

## 3. Mobile-first

Revisar:

- safe areas;
- teclado;
- una mano;
- scroll;
- tap targets;
- orientacion portrait como base;
- Android back;
- iOS gestures;
- estados de permiso.

---

## 4. Map accessibility

El mapa no puede ser la unica forma de acceder a contenido critico.

Debe haber alternativa:

- Search;
- lista;
- sheet;
- recientes;
- filtros.

---

## 5. Checklist Accessibility por PR

```md
## Accessibility
- Icon buttons con label:
- Tap targets:
- Contraste:
- Texto largo/dynamic type:
- Focus/back/cerrar:
- Keyboard/screen reader si aplica:
- Reduced motion:
- Alternativa al mapa:
- No color-only state:
```
