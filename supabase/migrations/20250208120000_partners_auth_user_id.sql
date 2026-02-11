-- Permitir que el partner tenga usuario de acceso (login)
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS partners_auth_user_id_key ON public.partners(auth_user_id) WHERE auth_user_id IS NOT NULL;
