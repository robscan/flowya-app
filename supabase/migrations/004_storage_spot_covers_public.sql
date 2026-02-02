-- Hacer el bucket spot-covers público para que las URLs de getPublicUrl() carguen en el cliente.
UPDATE storage.buckets
SET public = true
WHERE id = 'spot-covers';
