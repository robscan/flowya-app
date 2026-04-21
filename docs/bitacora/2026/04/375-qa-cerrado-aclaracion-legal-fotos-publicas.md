# 375 — QA cerrado y aclaración legal/copy de fotos públicas

**Fecha:** 2026-04-20
**Estado:** ejecutado

## 1) Motivo

Con el QA del bloque correctivo P0 cerrado, se ajusta la secuencia operativa:

- se elimina el punto 5 que proponía `Media v2` como siguiente paso de este frente;
- en su lugar se revisa el texto legal y de consentimiento para que no exista ambigüedad sobre el alcance de `Compartir`.

## 2) Decisión

1. `Media v2` queda fuera de esta ejecución.
2. Se aclara en copy producto + política + contrato que:
   - elegir **Compartir** publica las fotos en FLOWYA;
   - **todos los usuarios** de FLOWYA podrán ver esas fotos;
   - elegir **Solo para mí** mantiene las fotos privadas.

## 3) Superficies alineadas

- `components/ui/share-photos-consent-modal.tsx`
- `components/account/web/AccountPrivacyPanel.web.tsx`
- `app/create-spot/index.web.tsx`
- `app/spot/edit/[id].web.tsx`
- `lib/legal/privacy-policy-es.ts`
- `docs/contracts/PHOTO_SHARING_CONSENT.md`
- `docs/ops/analysis/ARCHITECTURE_TAGS_MULTI_COUNTRY_PHOTO_PRIVACY_2026-04-20.md`

## 4) Guardrail

No cambia el modelo de datos ni la semántica runtime de `share_photos_with_world`; solo se elimina ambigüedad contractual/copy para reflejar el comportamiento real.
