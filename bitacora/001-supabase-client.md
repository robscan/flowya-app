# Bitácora: Cliente Supabase

## Paso: Cliente Supabase único

**Fecha:** 2025-02-01

### Objetivo

Disponer de un único cliente de Supabase en el proyecto para uso en toda la app.

### Cambios realizados

1. **Carpeta `lib/`**  
   Creada en la raíz del proyecto (mismo nivel que `components`, `hooks`, etc.).

2. **Archivo `lib/supabase.ts`**  
   - Cliente inicializado con `@supabase/supabase-js`.  
   - Variables de entorno usadas:
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Sin lógica de auth ni consultas; solo creación y export del cliente.

### Uso

Importar el cliente donde se necesite:

```ts
import { supabase } from '@/lib/supabase';
```

Configurar las variables en `.env` o en la configuración de Expo (por ejemplo en EAS):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Archivos tocados

- **Creados:** `lib/supabase.ts`, `bitacora/001-supabase-client.md`
- **Modificados:** ninguno
