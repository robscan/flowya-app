# FLOWYA Interaction Design System

**Estado:** CANONICO / IXD
**Fecha:** 2026-04-27

---

## 1. Proposito

Interaction Design define como se siente usar FLOWYA: navegacion, gestos, transitions, feedback, control, ritmo, continuidad y reversibilidad.

FLOWYA debe sentirse fluida, pero nunca quitar control. En viaje, claridad y reversibilidad valen mas que magia.

---

## 2. Principios IXD

- Una intencion dominante por superficie.
- Toda accion importante debe tener feedback.
- Toda accion destructiva o publica debe pedir confirmacion.
- Todo flujo debe tener back/cerrar claro.
- La app debe conservar contexto al cambiar entre dominios.
- Transitions deben explicar cambio de estado, no decorar.
- Gestos deben complementar controles visibles, no reemplazarlos.
- El usuario debe poder pausar, editar, deshacer o cancelar cuando el riesgo es alto.

---

## 3. Navegacion canonica

- Bottom nav cambia dominio: `Explore`, `Flow`, `Passport`.
- Avatar top-left abre Account.
- Search top-right abre Search global.
- Sheets son profundidad contextual, no navegacion primaria.
- Back stack debe conservar jerarquia: Geo -> Area/Ciudad -> Spot -> Flow handoff.

No hacer:

- usar bottom nav para modales;
- abrir sheets apiladas sin contrato;
- cambiar dominio sin preservar o cerrar estado de forma explicita;
- crear rutas invisibles que el usuario no puede deshacer.

---

## 4. Gestos

Gestos permitidos:

- drag de sheet;
- tap en mapa/pin;
- pan/zoom mapa;
- swipe/back nativo cuando aplique;
- scroll listas.

Reglas:

- Todo gesto critico debe tener alternativa visible.
- Gesto programatico no debe contarse como gesto usuario.
- Drag de sheet no debe disparar acciones de datos.
- Tap repetido no debe crear duplicados.
- Inputs y teclado tienen prioridad sobre gestures decorativos.

---

## 5. Feedback

Cada accion debe responder:

- recibido;
- en progreso;
- completado;
- fallido con accion siguiente.

Ejemplos:

- guardar destino;
- agregar a Flow;
- subir foto;
- cambiar estado visitado;
- compartir Passport;
- aplicar filtro.

Regla:

- Feedback no debe bloquear si la accion no requiere bloqueo.
- Feedback no debe mentir: si algo esta pendiente, no decir completado.

---

## 6. Transitions y motion

Motion debe:

- orientar;
- mantener continuidad espacial;
- respetar reduced motion;
- no retrasar tareas frecuentes;
- no esconder cambios de contexto.
- En iOS, puede usar transiciones nativas SwiftUI/UIKit si respetan [`FLOWYA_IOS_NATIVE_UI_SYSTEM.md`](FLOWYA_IOS_NATIVE_UI_SYSTEM.md) y no duplican logica de negocio.

Bloquear:

- motion que impide lectura;
- animation-only feedback;
- cambios abruptos de sheet sin causa visible;
- transiciones largas para acciones repetidas.

---

## 7. Estados de control

Acciones de alto riesgo requieren control explicito:

- publicar/compartir;
- borrar;
- pagar;
- cambiar privacidad;
- persistir sugerencia IA;
- crear entidad canonica;
- subir foto publica.

Acciones de bajo riesgo pueden ser directas:

- abrir ficha;
- expandir sheet;
- filtrar visualmente;
- navegar mapa.

---

## 8. Checklist IXD por PR

```md
## Interaction Design
- Intencion dominante:
- Back/cerrar/deshacer:
- Feedback por accion:
- Gestos con alternativa visible:
- Transitions justificadas:
- Motion nativo iOS revisado si aplica:
- Estado async claro:
- Riesgo de doble tap/duplicado:
- Control explicito para acciones sensibles:
```
