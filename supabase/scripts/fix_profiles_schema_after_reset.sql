-- Ejecutar en la rama develop (o cualquier entorno) después de un reset
-- cuando aparece "Database error querying schema" al iniciar sesión.
-- Añade columnas en profiles, permisos y recarga el esquema de la API.

-- 1) Asegurar que la tabla profiles exista (por si el reset dejó la DB vacía)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  last_name text,
  phone text,
  user_type text NOT NULL DEFAULT 'cliente' CHECK (user_type IN ('cliente', 'partner', 'admin')),
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Columnas que pueden faltar si solo se aplicó initial_schema
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.profiles.last_name IS 'Apellidos del usuario';
COMMENT ON COLUMN public.profiles.is_active IS 'Si false, el usuario no puede iniciar sesión';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Fecha de baja lógica; si no es null, la cuenta está eliminada';

-- 3) Permisos para que la API (anon/authenticated) pueda leer el esquema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- 4) Trigger de nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, last_name, phone, user_type, is_active)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'user_type', 'cliente'),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) RLS (por si la tabla se creó con CREATE TABLE IF NOT EXISTS y no tenía políticas)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven su perfil" ON public.profiles;
CREATE POLICY "Usuarios ven su perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Usuarios insertan su perfil" ON public.profiles;
CREATE POLICY "Usuarios insertan su perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Usuarios actualizan su perfil" ON public.profiles;
CREATE POLICY "Usuarios actualizan su perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6) PostgREST: indicar esquemas a exponer (en develop suele faltar y provoca "Database error querying schema")
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, storage';

-- 7) Recargar esquema en PostgREST
NOTIFY pgrst, 'reload schema';

-- Si el error sigue: en Dashboard > Project Settings > API, prueba "Reload schema" o reinicia el proyecto.
