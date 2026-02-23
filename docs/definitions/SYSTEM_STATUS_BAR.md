# System Status Bar — Comunicación sistema-usuario (canónico)

**Estado:** Fuente de verdad para mensajes y hints del sistema al usuario.  
**Alcance:** Reemplazo de toast; mensajes de estado; hints contextuales (futuro).  
**Última actualización:** 2026-02-23

---

## 1. Principio

El sistema se presenta como un **asistente de viaje**: cercano, útil y no intrusivo. Los mensajes no son notificaciones técnicas sino comentarios que ayudan al usuario a entender qué pasó y qué puede hacer a continuación.

---

## 2. Ubicación y comportamiento

- **Posición:** Franja fija debajo de los controles superiores (perfil, filtro, buscar). Siempre en el mismo lugar; el usuario aprende a esperar los mensajes ahí.
- **Altura:** 0 cuando vacío; crece hasta 3 líneas máximo cuando hay mensajes.
- **Apariencia:** Fondo sólido (stateSuccess / stateError / neutral). Máxima legibilidad sobre mapa y sheet.
- **Animación:** Entrada tipo "se escribe" (typewriter) o fade-in. Auto-oculta tras ~2,5 s.
- **Cola:** Múltiples mensajes se muestran por renglones (máx 3); se ocultan juntos.

---

## 3. Tono de voz (asistente de viaje)

| Evitar | Usar |
|--------|------|
| "Link copiado" | "Listo, el enlace está en el portapapeles." |
| "Pin quitado" | "Pin quitado. Puedes añadirlo de nuevo cuando quieras." |
| "No se pudo crear el spot" | "No se pudo crear el spot. Inténtalo de nuevo en unos segundos." |
| "Cambios guardados" | "Cambios guardados." |
| "Por visitar" / "Visitado" | "Añadido a Por visitar." / "Marcado como Visitado." |
| "El título es obligatorio" | "Escribe un nombre para el spot." |

**Reglas:**
- Tuteo: "tu mapa", "tu spot".
- Frases cortas, naturales.
- Errores: explicar qué falló + sugerir acción cuando tenga sentido.
- Éxitos: confirmar de forma clara, sin tecnicismos.

---

## 4. Inventario de mensajes (actual → propuesto)

### Éxito

| Contexto | Actual | Propuesto |
|----------|--------|-----------|
| Link copiado | "Link copiado" | "Listo, el enlace está en el portapapeles." |
| Pin quitado | "Pin quitado" | "Pin quitado. Puedes volver a añadirlo cuando quieras." |
| Por visitar | "Por visitar" | "Añadido a Por visitar." |
| Visitado | "Visitado" | "Marcado como Visitado." |
| Cambios guardados | "Cambios guardados" | "Cambios guardados." |
| Spot eliminado | "Spot eliminado" | "Spot eliminado." |
| Feedback enviado | "¡Gracias! Lo leemos con cariño." | "¡Gracias! Lo leemos con cariño." |

### Error

| Contexto | Actual | Propuesto |
|----------|--------|-----------|
| Crear spot falla | "No se pudo crear el spot" | "No se pudo crear el spot. Inténtalo de nuevo en unos segundos." |
| Guardar falla | "No se pudo guardar" | "No se pudo guardar. Inténtalo de nuevo." |
| Eliminar falla | "No se pudo eliminar. Reintenta." | "No se pudo eliminar. Inténtalo de nuevo." |
| Título vacío | "El título es obligatorio" | "Escribe un nombre para el spot." |
| Enviar feedback falla | "No se pudo enviar ahora" | "No se pudo enviar. Inténtalo más tarde." |

### Por defecto / informativo

| Contexto | Actual | Propuesto |
|----------|--------|-----------|
| Eliminando… | "Eliminando…" | "Eliminando…" |

---

## 5. Hints contextuales (futuro)

Mensajes proactivos según la actividad del usuario. Mismo componente y ubicación.

**Ejemplos:**

| Condición | Mensaje |
|-----------|---------|
| Inactivo ~30 s en mapa | "Explora el mapa o crea un spot." |
| Sin spots guardados | "Descubre puntos de interés en las ciudades." |
| Muchos resultados en búsqueda | "Acerca el zoom para ver los resultados en el mapa." |
| Primer uso de crear spot | "Mantén pulsado en el mapa para crear un spot." |

**Criterios:**
- No repetir el mismo hint en la misma sesión.
- Frecuencia mínima entre hints del mismo tipo.
- Hints desactivables por preferencia de usuario (futuro).

---

## 6. API canónica

```ts
// Reemplaza useToast
useSystemStatus(): {
  show: (message: string, options?: { type?: 'success' | 'error' | 'default' }) => void;
}

// Futuro: hints
showHint: (hintKey: string, message: string) => void;
```

---

## 7. Referencias

- Contrato: [docs/contracts/SYSTEM_STATUS_BAR.md](../contracts/SYSTEM_STATUS_BAR.md)
- Componente: `components/ui/system-status-bar.tsx` (por implementar)
- Sustituye: `components/ui/toast.tsx` y `useToast`
