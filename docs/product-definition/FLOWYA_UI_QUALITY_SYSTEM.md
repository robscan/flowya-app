# FLOWYA UI Quality System

**Estado:** CANONICO / CALIDAD VISUAL Y SISTEMA UI
**Fecha:** 2026-04-27

---

## 1. Proposito

FLOWYA no busca una UI espectacular. Busca una UI cuidada, consistente, limpia, responsive y escalable.

Este documento define reglas para que cada PR visual crezca como sistema y no como coleccion de pantallas.

---

## 2. Principio central

Ningun PR visual debe introducir UI one-off si existe un componente, template o token canonico aplicable.

La consistencia de gaps, paddings, iconos, radios, tipografia, superficies y estados es mandatoria.

---

## 3. Tokens obligatorios

### Spacing

- No usar valores libres para layout.
- Usar escala canonica (`xs`, `sm`, `md`, `lg`, `xl`, etc.) o token equivalente del repo.
- Gaps y paddings deben seguir la misma escala.

Bloquear:

- `padding: 13`;
- `gap: 7`;
- ajustes magicos para "que se vea bien" sin token.

### Iconos

Tamanos canonicos:

- 16: icono pequeno / metadata;
- 20: icono en row o control compacto;
- 24: icon button base;
- 32: icono destacado puntual.

Bloquear:

- iconos 19, 21, 27 sin justificacion;
- iconos manuales si existe icono de libreria disponible;
- iconos sin accesibilidad/label cuando son accionables.

### Radius

- Usar escala canonica.
- Cards maximo 8px salvo componente existente que defina otra cosa.
- No crear "pill" o card redondeada sin razon de sistema.

### Typography

- Usar roles, no tamanos sueltos.
- Evitar hero-scale dentro de panels, sheets, cards o tool surfaces.
- Letter spacing debe ser 0 salvo excepcion documentada.

### Color / Surface

- Usar tokens de tema.
- No hardcodear colores.
- Evitar paletas de una sola familia si la pantalla se vuelve plana o monotona.

---

## 4. Templates canonicos requeridos

Toda pantalla/superficie nueva debe mapear a un template o proponer uno.

Templates base:

- `AppShellTemplate`
- `GeoSheetTemplate`
- `SpotSheetTemplate`
- `FlowWorkspaceTemplate`
- `PassportDashboardTemplate`
- `AccountPanelTemplate`
- `SearchSurfaceTemplate`
- `EmptyStateTemplate`
- `PaywallTemplate`
- `SettingsSectionTemplate`

Si no existe template:

1. justificar por que;
2. definir estructura;
3. listar estados;
4. decidir si entra a vitrina antes de runtime.

---

## 5. Componentes canonicos

Antes de crear un componente nuevo, buscar si existe:

- button;
- icon button;
- search field;
- tabs;
- chips;
- list row;
- card;
- sheet header;
- action bar;
- KPI block;
- empty state;
- toast/status;
- modal;
- paywall block.

Crear componente nuevo solo si:

- resuelve un patron reutilizable;
- evita duplicacion real;
- tiene variantes claras;
- tiene estados definidos;
- usa tokens;
- se documenta o se agrega a vitrina si es visualmente nuevo.

---

## 6. Reglas por superficie

### Shell

- Bottom nav solo `Explore`, `Flow`, `Passport`.
- Avatar top-left abre Account.
- Search top-right.
- No meter CTA secundaria permanente en shell si compite con Search/nav.

### Sheets

- Header canonico.
- Back/cerrar claros.
- Snap states consistentes.
- Progressive disclosure real.
- No apilar sheets sin contrato.
- No duplicar search inline si Search global cubre la intencion.

### Cards

- No cards dentro de cards.
- Cards son para items repetidos, no para secciones completas de pagina.
- Acciones internas no deben romper accesibilidad ni nesting interactivo.

### Lists

- Rows consistentes.
- Densidad controlada.
- CTA de accion masiva no debe desplazar contenido principal.
- Empty states simples y accionables.

### Map

- Una intencion dominante.
- No saturar con capas, badges, flows, memories y spots al mismo tiempo.
- Pins/overlays deben ser legibles en iPhone pequeno.

---

## 7. Estados obligatorios

Todo componente o superficie nueva debe declarar si aplica:

- default;
- loading;
- empty;
- error;
- disabled;
- selected;
- pressed/hover/focus;
- offline/slow;
- premium locked;
- permission required.

Si un estado no aplica, debe ser explicitado como "no aplica".

---

## 8. QA visual minimo

Para PR visual:

- iPhone pequeno;
- iPhone moderno;
- Android razonable;
- web responsive si toca web;
- dark/light si aplica;
- texto largo;
- idioma largo si aplica;
- loading/empty/error;
- safe areas;
- teclado si hay input.

Bloquear merge si:

- texto se solapa;
- controles quedan fuera del pulgar/viewport;
- iconos varian sin razon;
- hay colores hardcodeados;
- se introduce patron paralelo;
- UI solo funciona en desktop;
- no hay estado error/empty en flujo que puede fallar.

---

## 9. Vitrina

La vitrina de DS no es marketing. Es herramienta de QA y consistencia.

Regla:

- Si un PR introduce una nueva familia visual, debe pasar por vitrina o documentar por que no.

---

## 10. Checklist UI por PR

```md
## UI Quality
- Usa tokens de spacing/radius/color/type:
- Usa componentes canonicos:
- Usa template canonico:
- Nuevos componentes justificados:
- Estados cubiertos:
- Icon sizes canonicos:
- Mobile iOS/Android revisado:
- Texto largo revisado:
- A11y visual/touch revisada:
- Vitrina requerida:
```
