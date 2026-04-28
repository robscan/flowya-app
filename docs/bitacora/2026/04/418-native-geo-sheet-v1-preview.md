# 418 — Native GeoSheet V1 preview

**Fecha:** 2026-04-28
**Rama:** `codex/native-geo-sheet-v1-preview-049`
**OL relacionado:** `OL-GLOBAL-SHELL-SEARCH-001`, `OL-DATA-MODEL-INTROSPECTION-001`

## Contexto

La version nativa ya podia buscar entidades geo oficiales y guardar marcas personales, pero la GeoSheet seguia demasiado operativa: titulo, subtitulo y acciones. Para avanzar hacia un producto mobile-first mas robusto, la ficha necesitaba explicar el nivel geo sin crear datos nuevos ni heredar la logica web.

## Alcance aplicado

- `NativeGeoSheet` agrega pills de tipo geo y estado personal.
- La ficha muestra un bloque `Destino` con resumen contextual por pais, region o ciudad.
- Se agrega una grilla minima con `Jerarquia` y estado de mapa (`Mapa con encuadre`, `Mapa con centro`, `Mapa pendiente`).
- Se centralizan labels seguros en `lib/geo/display.ts`.
- Se agrega cobertura de regresion para los helpers de display geo.

## Alcance excluido

- No cambia DB, RLS, Storage ni migraciones.
- No cambia web.
- No agrega datos editoriales duros de pais/region/ciudad.
- No crea ni modifica `spots` al seleccionar entidades geo.
- No abre Flow, Passport ni Account.

## Riesgos y mitigacion

- Riesgo: saturar la sheet en pantalla chica. Mitigacion: contenido compacto, dos niveles de informacion y acciones visibles al pie.
- Riesgo: copy demasiado definitivo sin modelo geo editorial completo. Mitigacion: copy generico y seguro, sin visa, salud, dinero, clima, transporte ni emergencias.
- Riesgo: divergencia visual entre Search, GeoSheet y SpotSheet. Mitigacion: se apoya en `NativeSheetShell` y `NativeSheetHeader`.

## Verificacion

```bash
npx tsc --noEmit
npm run test:regression
git diff --check
```

Resultado: todas pasan.

Validacion visual propia en iPhone 15 Pro Simulator:

- el mapa nativo renderiza;
- Search con `mexico` muestra `Destinos oficiales`;
- al abrir `Mexico`, la GeoSheet muestra jerarquia, estado, resumen y acciones.

Evidencia local: `/tmp/flowya-native-geo-sheet-v1-preview.png`.

## Rollback

Rollback de codigo:

```bash
git revert <commit>
```

No requiere rollback DB.

## Proximo paso recomendado

Profundizar `NativeSpotSheet` con el mismo criterio progresivo: contenido util minimo, estado claro, acciones visibles y sin persistencias nuevas hasta que el contrato de spots quede cerrado.
