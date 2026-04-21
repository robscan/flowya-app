# 374 — Arquitectura: etiquetas v2, filtro multi-país y privacidad por foto

**Fecha:** 2026-04-20
**Estado:** análisis / intake de alcance

## 1) Motivo

Se agregan requerimientos de producto previos al siguiente loop formado:

- editar nombre de etiqueta;
- asignar etiquetas a varios spots desde lista de resultados;
- permitir más de un país en filtros;
- mostrar y editar privacidad por foto (mezcla pública/privada);
- evaluar menú `Etiquetas` dentro de perfil.

## 2) Decisión

1. Estos requerimientos quedan registrados, pero **no abren loop nuevo todavía**.
2. Se distingue entre:
   - **extensión segura**: panel `Etiquetas`, rename de etiqueta, bulk tagging;
   - **cambio estructural**: filtro multi-país y privacidad por foto.
3. La privacidad por foto **no** se implementará como parche sobre `spot_images` + `spot_personal_images`; primero requiere diseño de media canónica por foto.
4. Tras cerrar QA del bloque correctivo P0, se elimina de la secuencia inmediata el punto «Media v2» y se sustituye por una revisión de política/copy para dejar explícito que elegir **Compartir** vuelve visibles esas fotos para todos los usuarios de FLOWYA.

## 3) Evidencia documental

- Análisis de capacidad: [`ARCHITECTURE_TAGS_MULTI_COUNTRY_PHOTO_PRIVACY_2026-04-20.md`](../../ops/analysis/ARCHITECTURE_TAGS_MULTI_COUNTRY_PHOTO_PRIVACY_2026-04-20.md)
- Contratos afectados:
  - [`USER_TAGS_EXPLORE.md`](../../contracts/USER_TAGS_EXPLORE.md)
  - [`PHOTO_SHARING_CONSENT.md`](../../contracts/PHOTO_SHARING_CONSENT.md)
  - [`PROFILE_VNEXT_MENU_KPIS.md`](../../contracts/PROFILE_VNEXT_MENU_KPIS.md)
  - [`OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md)

## 4) Gate operativo

Antes de promover cualquiera de estos alcances a ejecución:

1. cerrar QA del bloque correctivo P0 del 2026-04-20;
2. decidir si el siguiente loop será `Etiquetas v2` o `Filtro multi-país v2`;
3. no mezclar `Media v2` con otro loop si no existe contrato y plan de migración.
