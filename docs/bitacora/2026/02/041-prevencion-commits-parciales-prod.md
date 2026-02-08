# Bitácora 041 (2026/02) — Prevención: commits parciales y prod

**Problema:** En prod fallaban la búsqueda "Sagrada" (resultados "En todo el mapa") y el CTA "Crear", con errores:
- `ReferenceError: effectiveBBox is not defined`
- `TypeError: (0 , O.resolvePlaceForCreate) is not a function`

En local todo funcionaba. Solo una persona/agente edita código; la omisión fue del **modo de trabajo**, no de múltiples autores.

---

## Causa raíz

Cambios que afectaban a **varios archivos** se commitearon **solo en parte**:

1. **resolvePlaceForCreate**  
   Se había actualizado `index.web.tsx` para importar y usar `resolvePlaceForCreate` (con opts proximity/bbox). El archivo `lib/mapbox-geocoding.ts` donde se **exporta** esa función (sustituyendo `resolvePlace`) nunca se incluyó en un commit; quedó solo en working copy. En main el módulo seguía exportando `resolvePlace` → en prod la importación era `undefined`.

2. **spotsStrategy / bboxFilter**  
   En main, `lib/search/spotsStrategy.ts` seguía con la versión antigua (variable `effectiveBbox`, sin guard temprano, sin `normalizeQuery`). La versión refactorizada (`bboxFilter`, guard, `normalizeQuery`) existía solo en local y no se había subido. Prod ejecutaba la versión antigua; el error podía venir del bundle/minificación.

Consecuencia: **main (y prod) tenía un contrato roto**: código que importa/usa una API que en main no existía o no coincidía.

---

## Corrección aplicada

- Commit `1057b84`: se subieron a main `lib/mapbox-geocoding.ts` y `lib/search/spotsStrategy.ts` (versión local), alineando prod con local.
- Regla de trabajo: **.cursor/rules/commits-completos-y-deploy.mdc** (siempre aplicar).

---

## Prevención (regla de trabajo)

Al commitear y antes de dar por cerrado un push:

1. **Commit completo:** Un cambio lógico (fix/feature) debe incluir **todos** los archivos que forman parte de ese cambio. No commitear solo el "archivo principal" dejando módulos o dependencias modificados sin subir.

2. **Verificación de dependencias:** Si el commit incluye un archivo A que importa algo desde B, asegurarse de que B esté en el mismo commit o que en main B ya exporte lo que A importa. Si A y B se usan juntos (ej. pantalla + lib, controller + strategy), cambios de contrato entre ambos → ambos en el commit.

3. **Pre-push:** Revisar `git status`; si quedan archivos modificados que pertenecen al mismo cambio, incluirlos o dejar explícito que se excluyen a propósito.

La regla en `.cursor/rules/` obliga a aplicar este checklist para que no se repita el mismo tipo de omisión.

---

## Resumen

| Qué | Acción |
|-----|--------|
| Causa | Commits parciales: se subió quien importa/usa, no quien exporta/implementa. |
| Corrección | Subir a main los archivos que faltaban (mapbox-geocoding, spotsStrategy). |
| Prevención | Regla "commits-completos-y-deploy": un cambio = todos sus archivos; verificar imports/export antes de cerrar commit y antes de push. |
