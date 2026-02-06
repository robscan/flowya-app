# Bitácora 027 (2026/02) — Diagnóstico error "message channel closed" en consola

**Tipo:** Investigación / diagnóstico  
**Estado:** Cerrado  
**Alcance:** Revisión de código y runtime; sin cambios en la app.

---

## Error observado (producción)

```
Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
```

---

## Objetivo

Confirmar si el error proviene del código de la app FLOWYA o es externo (extensiones del navegador / service worker / runtime).

---

## Revisión realizada

### 1. Búsqueda en el repo

- **chrome.runtime.onMessage** — No existe en el código de la app.
- **postMessage** — No existe.
- **MessageChannel** — No existe.
- **window.addEventListener('message')** — No existe.
- **Listeners que devuelvan `true` en callbacks async** — El único `return true` encontrado está en `lib/share-spot.ts` (línea 22), dentro de `copyToClipboard()` como valor de retorno de una función async (éxito de `navigator.clipboard.writeText`). No es un listener de mensajes ni está relacionado con message channels.

### 2. Service workers / PWA

- No hay registro de service worker en el código (no `navigator.serviceWorker.register`, no `workbox`, no `sw.js` en `public/`).
- `app.json` → `web.output: "static"`; no hay plugin PWA ni configuración de service worker.
- `app/+html.tsx` no registra ningún worker.

### 3. Messaging cross-context

- No hay uso de `postMessage`, `MessageChannel` ni listeners de `message` en el código de la app.
- No hay integración con APIs de extensiones (`chrome.*`).

### 4. Librerías externas (Mapbox, Expo, analytics)

- El texto exacto del error coincide con la documentación y reportes de la **Chrome Extension Messaging API** (`chrome.runtime.onMessage`): cuando un listener devuelve `true` (respuesta asíncrona esperada) pero no se llama a `sendResponse()` antes de que se cierre el canal, Chrome lanza este error.
- La app FLOWYA no usa `chrome.runtime` ni APIs de extensiones. Las dependencias (Expo, react-map-gl, Mapbox, Supabase, etc.) no registran en el código propio listeners de mensajes con este patrón.

---

## Conclusión del diagnóstico

- **Origen del error:** Externo a la app. Asociado al runtime de **extensiones del navegador** (Chrome/Chromium): un listener de `chrome.runtime.onMessage` en alguna extensión instalada indica respuesta asíncrona (`return true`) pero no envía la respuesta antes de que se cierre el canal (p. ej. contexto de la extensión destruido o callback que no llama a `sendResponse()`).
- **No existe en el repo** ningún listener propio que use messaging asíncrono con message channel ni APIs de extensiones.
- **Impacto en FLOWYA:** Ninguno. El error no afecta la funcionalidad de la app; aparece en consola cuando hay extensiones activas que usan messaging de forma incorrecta en las páginas donde se ejecuta la app.

---

## Decisión

- **Ignorar conscientemente** el error en el contexto de FLOWYA: no proviene del código de la app, no es corregible desde el repo y no bloquea el roadmap.
- **No añadir** workarounds, try/catch cosméticos ni supresiones de error en el código de la app.
- Si en el futuro se confirma que una dependencia concreta (p. ej. una versión de Expo web o de Mapbox) inyecta este patrón, se podrá revaluar; con la revisión actual no hay evidencia de causa interna.

---

## Criterio de cierre

- Diagnóstico documentado.
- Confirmación de no impacto en la app.
- Decisión de no actuar en código registrada.
- Este error no bloquea avanzar con el roadmap.
