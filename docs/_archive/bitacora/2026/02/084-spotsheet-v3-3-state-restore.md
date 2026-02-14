# Bitácora 084 (2026/02) — SpotSheetV3: restauración 3 estados, scroll containment, dedupe

## Resumen

- Restaurado comportamiento de 3 estados (peek / medium / expanded) en ExploreV3 web.
- peek: SpotPeekCardV3Web (card fija bottom). medium/expanded: SpotSheetV3Web (Radix Dialog).
- Alturas snap: medium 52dvh, expanded 86dvh (sin gestos; handle toggle).
- Scroll solo en body interno; overscrollBehavior: contain; overflow hidden en Content.
- Header estable: Share (izq, absolute), título (centro), Close (der, absolute). Share eliminado de actions row.
- MapScreenVNext: peek → solo PeekCard; medium/expanded → solo Sheet (sin duplicar).
- Mantiene fix Micro-scope 18: StyleSheet.flatten para Radix DOM.
- onRequestState prop opcional (alias onSheetStateChange) para futuro drag handle.
