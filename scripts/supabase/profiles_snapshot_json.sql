-- Una sola fila JSON con columnas de public.profiles (pegar resultado en snapshot JSON).
SELECT json_build_object(
  'table', 'profiles',
  'columns',
  (SELECT json_agg(
    json_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable,
      'column_default', column_default
    ) ORDER BY ordinal_position
  )
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'profiles')
) AS profiles_snapshot;
