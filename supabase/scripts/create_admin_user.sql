-- Crear un usuario admin. Ejecutar en Supabase SQL Editor cuando haga falta.
-- Email: admin@escapar.mx  |  Contraseña: DevPass2025!

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@escapar.mx');
DELETE FROM auth.users WHERE email = 'admin@escapar.mx';

DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_id,
    'authenticated',
    'authenticated',
    'admin@escapar.mx',
    crypt('DevPass2025!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrador","last_name":"","user_type":"admin"}'::jsonb,
    now(),
    now()
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    v_id,
    format('{"sub":"%s","email":"admin@escapar.mx","email_verified":true}', v_id)::jsonb,
    'email',
    v_id::text,
    now(),
    now(),
    now()
  );
  INSERT INTO public.profiles (id, email, full_name, last_name, phone, user_type)
  VALUES (v_id, 'admin@escapar.mx', 'Administrador', '', NULL, 'admin')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    last_name = EXCLUDED.last_name,
    user_type = EXCLUDED.user_type;
END $$;

NOTIFY pgrst, 'reload schema';
