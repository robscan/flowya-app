# FLOWYA Store Readiness System

**Estado:** CANONICO / APP STORE & PLAY STORE
**Fecha:** 2026-04-27

---

## 1. Proposito

FLOWYA debe estar preparada para salir a tiendas con el menor riesgo posible de rechazo en App Store y Play Store.

Este documento aplica a cualquier PR que toque mobile, auth, permisos, privacidad, pagos, fotos, ubicacion, contenido de usuario, IA, membresias o release.

---

## 2. Principio central

No se cierra V1 mobile si la app no puede explicar claramente:

- que datos usa;
- por que pide permisos;
- que se publica y que queda privado;
- como eliminar cuenta/datos;
- como reportar problemas;
- como funcionan membresias/pagos;
- como se protege contenido del usuario;
- que hacer si algo falla.

---

## 3. Areas criticas de revision

### Permisos

- Pedir permisos just-in-time.
- Explicar beneficio antes de prompt sensible.
- No bloquear app completa si permiso no es esencial.
- Ofrecer camino alternativo cuando sea razonable.
- Revisar purpose strings para ubicacion, fotos, camara, notificaciones o tracking si aplican.

### Privacidad y datos

- Politica de privacidad accesible.
- Account deletion o ruta clara para solicitar/eliminar cuenta.
- Export/delete data si se promete.
- Privacidad de fotos y recuerdos clara.
- No exponer ubicacion/fotos privadas.
- No recolectar datos innecesarios.

### User Generated Content

Si hay fotos, notas, lugares, perfiles o contenido compartible:

- definir report/contact support;
- diferenciar contenido privado/publico;
- evitar publicar automaticamente;
- permitir ocultar/eliminar contenido propio;
- revisar moderacion minima si hay contenido publico.

### Compras / membresias

- Usar In-App Purchase si se desbloquean funcionalidades digitales dentro de la app.
- Explicar planes, precio, periodo y renovacion.
- No usar paywalls manipulativos.
- Restaurar compras.
- Manejar cancelacion/downgrade sin perdida opaca de datos.
- Evitar menciones a metodos externos prohibidos si aplica.

### Metadata de tienda

Preparar:

- nombre;
- subtitulo/short description;
- descripcion;
- keywords;
- screenshots mobile reales;
- categoria;
- edad/rating;
- support URL;
- privacy URL;
- review notes;
- demo account si review lo requiere.

### Estabilidad y performance

Antes de submission:

- build release iOS/Android;
- smoke test en dispositivos reales/simuladores;
- smoke test iOS Simulator obligatorio si el PR toca shell, mapa, navegacion mobile, permisos, fotos, auth o cualquier superficie store-critical;
- si el PR toca Liquid Glass/SwiftUI/UIKit, validar tambien Reduce Motion, Reduce Transparency, Dynamic Type, safe areas, teclado y fallback segun [`FLOWYA_IOS_NATIVE_UI_SYSTEM.md`](FLOWYA_IOS_NATIVE_UI_SYSTEM.md);
- crash-free en flujos principales;
- startup razonable;
- mapa estable;
- Search estable;
- uploads con error/retry;
- auth/session persistence;
- deep links si aplica;
- offline/poor network behavior.

---

## 4. No-go de tienda

No enviar a review si:

- no existe politica de privacidad accesible;
- no existe ruta de eliminacion de cuenta/datos;
- permisos no tienen explicacion clara;
- hay fotos/recuerdos que pueden publicarse por accidente;
- hay suscripciones sin restore/cancelacion clara;
- hay contenido publico sin mecanismo de reporte/soporte;
- app crashea en auth, mapa, Search, fotos o pagos;
- paywall bloquea privacidad/seguridad;
- metadata promete features no existentes;
- review necesita cuenta y no hay credenciales/instrucciones;
- datos criticos carecen de fuente/frescura si se presentan como factuales.

---

## 5. Checklist Store Readiness por PR

```md
## Store Readiness
- Toca iOS/Android:
- iOS Simulator smoke:
- iOS native material/motion si aplica:
- Permisos:
- Privacy policy / account deletion:
- UGC / report / delete:
- Membership / IAP / restore:
- Metadata afectada:
- Release build impact:
- Crash/performance risk:
- Accessibility:
- Review notes necesarias:
```

---

## 6. Definition of Done para release candidate

Un release candidate mobile debe tener:

- `OPEN_LOOPS` sin P0/P1 bloqueante de tiendas;
- build iOS release validado;
- build Android release validado;
- auth/session validada;
- permisos validados con copy;
- politica de privacidad y soporte enlazados;
- account deletion definido;
- membresias/IAP validadas si aplican;
- fotos/Storage/privacy validados;
- mapa/Search/sheets smoke-tested;
- crash/performance baselines revisados;
- screenshots y metadata listas;
- review notes listas;
- rollback/hotfix plan.
