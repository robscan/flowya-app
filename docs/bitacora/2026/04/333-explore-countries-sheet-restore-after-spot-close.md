# 333 — Explore: restaurar CountriesSheet al cerrar SpotSheet (KPI)

**Fecha:** 2026-04-11  
**Motivo:** `showCountriesCounter` depende de `sheetState === "peek"` (SpotSheet); al abrir un pin el sheet pasa a medium y un efecto cerraba Countries aunque el usuario no lo hubiera cerrado.  
**Implementación:** `countriesSheetBeforeSpotSheetRef` + `captureCountriesBeforeSpotFnRef` (captura antes de abrir spot/POI en KPI con Countries abierto); restauración en `SpotSheet` `onClose`; ref anulada al cerrar Countries manualmente, al abrir spot desde lista de países, o al abrir búsqueda con snapshot paralelo.

**Contrato:** `FILTER_RUNTIME_RULES.md` §1c, `EXPLORE_CHROME_SHELL.md` §7.
