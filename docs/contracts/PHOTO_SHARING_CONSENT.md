# PHOTO_SHARING_CONSENT — Contrato

**Estado:** CURRENT  
**Última actualización:** 2026-04-20  
**Relación:** `profiles.share_photos_with_world`, `components/explorar/MapScreenVNext.tsx`, `app/spot/edit/[id].web.tsx`, `app/account/index.web.tsx`, `components/ui/share-photos-consent-modal.tsx`.

---

## 1) Intención

Antes de que el usuario suba fotos por primera vez, FLOWYA debe pedir consentimiento:

- **“¿Compartir tus fotos con el mundo?”**
- La decisión se persiste y se puede editar en `/account`.

Esta preferencia **sí cambia el comportamiento** y debe explicarse sin ambigüedad al usuario:

- `ON` → fotos públicas visibles para **todos los usuarios** de FLOWYA (modelo actual: `spot_images` + bucket público `spot-covers`).
- `OFF` → fotos privadas (solo el dueño: bucket privado `spot-personal` + tabla `spot_personal_images`).

---

## 2) Fuente de verdad (DB)

### 2.1 `public.profiles.share_photos_with_world`

- **Tipo:** boolean nullable
- **Semántica:**
  - `null` = no decidido aún → mostrar modal al intentar subir fotos.
  - `true` = compartir (públicas y visibles para todos los usuarios).
  - `false` = solo para mí (privadas).

---

## 3) Modal (one-shot) — canon

### 3.1 Cuándo aparece

Se muestra **solo** si `share_photos_with_world` es `null` y el usuario intenta **subir una imagen** (cualquier punto de entrada).

### 3.2 Salidas (3)

- **Compartir** → persiste `true` y continúa el flujo de subida.
- **Solo para mí** → persiste `false` y continúa el flujo de subida (privada).
- **Ahora no** (cerrar/backdrop) → no persiste; aborta el flujo (no abre picker / no sube).

El copy del modal y de la pantalla `/account/privacy` debe dejar explícito que elegir **Compartir** significa que las fotos nuevas se publicarán en FLOWYA y **todos los usuarios podrán verlas**.

### 3.3 Template visual

Debe respetar el template canónico de modales (auth/confirm/beta):

- overlay oscuro + card `maxWidth: 400`, `Radius.xl`, padding `Spacing.lg`.
- botones con `WebTouchManipulation`.

---

## 4) Persistencia de imágenes por preferencia

### 4.1 ON (públicas)

- Storage: bucket `spot-covers` (público) en `{spotId}/gallery/*.jpg`.
- DB: `public.spot_images` (SELECT público; INSERT/UPDATE/DELETE solo owner).
- Side-effect: `syncCoverFromGallery(spotId)` para reflejar portada canónica en `spots.cover_image_url`.
- Copy producto/legal: no usar fórmulas ambiguas como «otras personas» si el alcance real es **todo usuario de FLOWYA**.

### 4.2 OFF (privadas)

- Storage: bucket **privado** `spot-personal` en `{spotId}/gallery/*.jpg` (SELECT/WRITE solo owner del spot).
- DB: `public.spot_personal_images` (owner-only).
- Rendering: usar **URLs firmadas** (`createSignedUrl`) para mostrar en UI.
- Guardrail: no escribir `spots.cover_image_url` ni filas en `spot_images` cuando OFF.

---

## 5) Edición en perfil

En `/account` debe existir un toggle:

- **“Compartir mis fotos con el mundo”** (ON/OFF).
- Cambiarlo actualiza `profiles.share_photos_with_world`.

---

## Troubleshooting

- Modal no aparece en primera subida:
  - verificar `profiles.share_photos_with_world` es `null` y el flujo llama al resolvedor antes del picker.
- Usuario elige OFF pero fotos se vuelven públicas:
  - revisar que el upload no use `uploadSpotGalleryImage` ni `addSpotImageRow`.
- Fotos privadas no se ven tras subir:
  - revisar RLS/policies de `spot-personal` y que se generen URLs firmadas.
