# Contrato — Resolución de Locale

## Alcance

Aplica a cualquier feature que renderiza texto dependiente de idioma o resuelve etiquetas regionales.

## Reglas obligatorias

1. **Fuente única**
   - El locale efectivo se obtiene solo vía `lib/i18n/locale-config.ts`.

2. **Modo manual (fase actual)**
   - `APP_LOCALE_MODE = "manual"`.
   - `APP_MANUAL_LOCALE` define el idioma forzado para QA/desarrollo.

3. **Modo sistema (fase futura)**
   - Al activar traducción, se cambia a `APP_LOCALE_MODE = "system"`.
   - No se permite introducir bypass locales por feature.

4. **Datos canónicos**
   - Claves de negocio deben persistirse en formato canónico (ej. ISO país).
   - Traducción ocurre en capa de presentación.

5. **Fallback**
   - Si no se puede resolver locale del sistema, fallback a `es-MX`.

## Criterios de aceptación mínimos

1. Al cambiar `APP_MANUAL_LOCALE`, etiquetas regionales cambian sin tocar código de feature.
2. En modo `system`, la app refleja idioma del dispositivo sin regressions en datos.
3. No existen lecturas directas de locale fuera de `locale-config` para nuevos desarrollos.
