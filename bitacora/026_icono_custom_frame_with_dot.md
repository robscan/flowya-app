# Bitácora 026 — Icono custom «Ver todo / Reencuadrar» (FrameWithDot)

## Objetivo

Crear un icono custom que comunique reencuadre de contenido, evitando la confusión con zoom, pantalla completa o ubicación que generaba el icono anterior (Scan).

## Por qué un icono custom

- Lucide no ofrece un icono que combine marco + punto central de forma inequívoca.
- Scan y Frame se prestaban a confusión con pantalla completa o zoom.
- El concepto «reencuadrar para ver lo importante» necesita un ícono específico.

## Qué comunica visualmente

- **4 esquinas tipo marco**: encuadre, límites de vista.
- **Punto sólido central**: elemento (usuario + spots) que se quiere enmarcar.
- Lectura: «ajustar la vista para incluir lo importante».

## Contexto de uso

- **Map controls** (Home): botón «Ver todo» sobre los controles de zoom.
- Acción: encuadrar el mapa mostrando ubicación del usuario (si existe) + spots visibles según el filtro activo.
- Estados: Normal cuando enabled (colors.text), Disabled (colors.textSecondary).

## Implementación

- **Archivo**: `components/icons/FrameWithDot.tsx`
- **Tecnología**: react-native-svg (Path + Circle)
- **Props**: size, color, strokeWidth
- **Estilo**: stroke redondeado (round caps/joins), coherente con Lucide.
- **Proyecto**: icono propio, sin registrar en Lucide.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| components/icons/FrameWithDot.tsx | Nuevo icono custom |
| components/design-system/map-controls.tsx | Scan → FrameWithDot |
| app/design-system.web.tsx | Documentación actualizada |
| bitacora/026_icono_custom_frame_with_dot.md | Esta bitácora |
