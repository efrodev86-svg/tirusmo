-- Solución para "Database error querying schema" en develop.
-- Ejecutar en SQL Editor del proyecto develop.

-- 1) Dar USAGE en storage a authenticator (así PostgREST puede introspeccionar si la config incluye storage)
GRANT USAGE ON SCHEMA storage TO authenticator;

-- 2) Dejar que el Dashboard controle los esquemas (Project Settings → API)
ALTER ROLE authenticator RESET pgrst.db_schemas;

-- 3) Pedir a PostgREST que recargue el esquema
NOTIFY pgrst, 'reload schema';

-- Si el error sigue: Dashboard → Project Settings → API → "Reload schema" o reiniciar el proyecto.
