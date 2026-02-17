-- Apellidos para usuarios (profiles). Teléfono ya existe en la tabla.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_name text;

COMMENT ON COLUMN public.profiles.last_name IS 'Apellidos del usuario';

-- Actualizar el trigger de nuevo usuario para incluir last_name desde metadata (opcional)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, last_name, phone, user_type)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'user_type', 'cliente')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
