# 408 — iOS native UI / Liquid Glass guideline

**Fecha:** 2026-04-28
**Rama:** `codex/geo-core-postmigration-verify`
**Area:** Product Definition, UI, IXD, Store Readiness

## Contexto

Producto decide que Flowya puede aprovechar material Liquid Glass, componentes nativos y motion propio de iOS, siempre que sea una adopcion real y no una emulacion superficial.

## Decision

Se agrega [`FLOWYA_IOS_NATIVE_UI_SYSTEM.md`](../../../product-definition/FLOWYA_IOS_NATIVE_UI_SYSTEM.md) como documento canonico iOS-only.

Regla principal:

- Liquid Glass se usa como capa de navegacion/control, no como piel global.
- SwiftUI/UIKit pueden usarse para superficies iOS de alto valor.
- AppKit queda fuera de iPhone/iPad salvo alcance futuro macOS/Catalyst.
- React Native conserva logica compartida, contratos, estado y adapters.
- Android/web no deben emular Liquid Glass por paridad visual forzada.

## Superficies candidatas

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

## Guardrails agregados

- `FLOWYA_QUALITY_GUARDRAILS.md` invoca el sistema iOS nativo cuando el PR toque shell, sheets, Search, material, SwiftUI/UIKit, Liquid Glass o motion nativo.
- `FLOWYA_UI_QUALITY_SYSTEM.md` permite material nativo en shell/chrome/sheets iOS solo bajo el nuevo guideline.
- `FLOWYA_INTERACTION_DESIGN_SYSTEM.md` exige motion nativo reversible, accesible y sin duplicar logica de negocio.
- `FLOWYA_PR_OPERATING_SYSTEM.md` actualiza prompts de UI/IXD y no-go triggers.
- `FLOWYA_STORE_READINESS_SYSTEM.md` agrega QA para Reduce Motion, Reduce Transparency, Dynamic Type, safe areas, teclado y fallback.

## No tocar

- No implementar Liquid Glass en este PR.
- No introducir SwiftUI/UIKit runtime sin micro-scope propio.
- No cambiar navegacion ni shell actual.
- No alterar Android/web.

## Proximo uso

Cuando un PR toque iOS visual o interaction, debe declarar si la superficie usa:

- material nativo real;
- fallback;
- React Native solamente;
- SwiftUI;
- UIKit;
- QA Simulator;
- QA dispositivo real antes de tiendas.
