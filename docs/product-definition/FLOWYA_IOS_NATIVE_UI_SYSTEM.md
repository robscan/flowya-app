# FLOWYA iOS Native UI System

**Estado:** CANONICO / iOS ONLY
**Fecha:** 2026-04-28

---

## 1. Proposito

FLOWYA debe sentirse nativa y cuidada en iPhone, sin copiar de forma literal la web actual ni emular materiales de Apple con decoracion superficial.

Este documento define como adoptar Liquid Glass, SwiftUI, UIKit y motion nativo en iOS cuando aporte claridad, control y calidad percibida.

---

## 2. Principio central

En iOS, Liquid Glass es una capa de navegacion y control, no una piel global.

Usarlo para:

- orientar;
- separar contenido de controles;
- sostener jerarquia;
- hacer que sheets, search y chrome se sientan nativos;
- mejorar continuidad espacial con transiciones del sistema.

No usarlo para:

- decorar cada card;
- esconder problemas de layout;
- reducir contraste;
- saturar listas densas;
- convertir el mapa en fondo secundario;
- imitar Apple en Android/web.

---

## 3. Stack permitido

### SwiftUI

Preferido para superficies iOS nuevas de alto valor:

- sheets;
- overlays;
- search command surface;
- tab/navigation chrome;
- estados vacios y permission prompts;
- transiciones y motion contextual.

### UIKit

Permitido cuando aporte mejor control de:

- hosting/integracion con React Native;
- gestos;
- presentacion modal;
- navigation controllers;
- performance;
- compatibilidad fina con APIs del sistema.

### AppKit

No aplica a iPhone/iPad runtime normal. Solo considerar si existe un alcance futuro macOS/Catalyst documentado.

### React Native

Sigue siendo valido para logica compartida, estado, contratos, adapters y superficies no diferenciadoras.

Regla:

- Si una superficie iOS promete Liquid Glass nativo, debe implementarse con capacidad nativa real o declararse como fallback.
- Un blur/translucency de React Native no debe llamarse Liquid Glass si no usa comportamiento/material nativo equivalente.

---

## 4. Superficies candidatas

Prioridad alta:

- bottom nav `Explore / Flow / Passport`;
- top chrome con Account y Search;
- Search global;
- `GeoSheet`;
- `SpotSheet`;
- Flow builder;
- Passport dashboard;
- Account panel;
- paywall/membership sheet;
- permission prompts.

Prioridad baja o no recomendada:

- list rows densos;
- cards repetidas;
- mapas y tiles;
- contenido editorial largo;
- galerias de fotos;
- superficies con texto critico sobre imagen.

---

## 5. Reglas Liquid Glass

- Aplicar en la capa superior de navegacion/control.
- Mantener contenido principal claro y legible.
- Garantizar contraste sobre mapa, fotos y fondos variables.
- Respetar safe areas, Dynamic Island, keyboard y bottom home indicator.
- Soportar Reduce Transparency.
- Soportar Reduce Motion.
- No bloquear lectura o acciones frecuentes con motion.
- No depender solo de shimmer/translucency para comunicar estado.
- No aplicar a Android/web por paridad visual forzada.

---

## 6. Reglas de motion iOS

Motion nativo debe:

- explicar transicion de estado;
- preservar continuidad entre mapa, sheet y search;
- sentirse reversible;
- respetar gestos del sistema;
- usar spring/transitions nativas cuando existan;
- reducirse o desactivarse con Reduce Motion.

Bloquear:

- animaciones largas en acciones repetidas;
- transiciones que impiden input inmediato;
- motion que crea falsa confirmacion;
- gestos invisibles sin alternativa visible.

---

## 7. Arquitectura compartida

La diferencia iOS debe vivir en presentacion, no en contratos de producto.

Compartido:

- dominio;
- datos;
- permisos;
- membership;
- Search intent;
- dedupe;
- estado de Explore/Flow/Passport;
- analytics/observabilidad permitida;
- copy canonico e i18n.

Especifico iOS:

- material;
- transiciones;
- gestos;
- native chrome;
- affordances del sistema;
- haptics si se aprueban en IXD.

No duplicar logica de negocio dentro de SwiftUI/UIKit.

---

## 8. Fallbacks

Cada superficie iOS nativa debe declarar:

- version minima de iOS;
- comportamiento si Liquid Glass no esta disponible;
- fallback visual;
- impacto en Android/web;
- plan de QA Simulator;
- plan de QA dispositivo real antes de tiendas.

---

## 9. Store readiness

Antes de considerar una superficie iOS lista para tiendas:

- validar en iPhone pequeno;
- validar en iPhone moderno con Dynamic Island;
- validar orientacion si aplica;
- validar teclado;
- validar permisos;
- validar Reduce Motion;
- validar Reduce Transparency;
- validar Dynamic Type;
- validar dark/light si aplica;
- capturar screenshot o evidencia manual.

---

## 10. Checklist iOS Native UI por PR

```md
## iOS Native UI
- Superficie iOS afectada:
- Es material nativo real o fallback:
- SwiftUI/UIKit/AppKit/RN usado:
- Liquid Glass aplica solo a navegacion/control:
- Android/web no emulan por fuerza:
- Contratos compartidos intactos:
- Reduce Motion revisado:
- Reduce Transparency revisado:
- Dynamic Type revisado:
- Safe areas/keyboard revisados:
- Simulator iOS revisado:
- Dispositivo real requerido antes de tiendas:
```
