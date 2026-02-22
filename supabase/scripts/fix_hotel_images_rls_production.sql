-- Soluciona: "new row violates row-level security policy" al subir imágenes en la galería (producción).
-- Causa: el INSERT en hotel_images y en storage.objects exige que el usuario sea admin (profiles.user_type = 'admin').

-- 1) Asegurar que la función current_user_is_admin exista y sea correcta
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2) Dar a un usuario concreto rol admin (sustituye 'TU_EMAIL@ejemplo.com' por el email del admin)
-- Descomenta y ejecuta solo esta línea con el email correcto:
-- UPDATE public.profiles SET user_type = 'admin' WHERE email = 'TU_EMAIL@ejemplo.com';

-- 3) Comprobar quién es admin (ejecutar en SQL Editor para verificar)
-- SELECT id, email, user_type FROM public.profiles WHERE user_type = 'admin';

-- Si el error persiste: confirma que en la app el usuario inicia sesión (Supabase Auth)
-- y que la petición usa la sesión (no solo la anon key). El cliente debe estar autenticado como admin.
