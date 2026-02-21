-- Usuarios por defecto en el sistema.
-- Se ejecuta al hacer "supabase db reset" en local y cuando se crea/resetea una rama (ej. develop).
-- Usa gen_random_uuid() para que los UIDs sean como los del registro.
-- Los tokens en auth.users deben ser '' y no NULL para evitar "Database error querying schema".
-- El trigger handle_new_user() crea el perfil en public.profiles.
-- Contraseña para todos: DevPass2025!

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Borrar usuarios seed anteriores (por email) para reinsertar con UIDs nuevos
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('dev@escapar.mx', 'usuario@escapar.mx', 'partner@escapar.mx'));
DELETE FROM auth.users WHERE email IN ('dev@escapar.mx', 'usuario@escapar.mx', 'partner@escapar.mx');

-- 1) Admin
DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, email_change_token_current, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'dev@escapar.mx', crypt('DevPass2025!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Usuario Desarrollo","last_name":"","user_type":"admin"}'::jsonb, now(), now(), '', '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, format('{"sub":"%s","email":"dev@escapar.mx","email_verified":true}', v_id)::jsonb, 'email', v_id::text, now(), now(), now());
  INSERT INTO public.profiles (id, email, full_name, last_name, phone, user_type)
  VALUES (v_id, 'dev@escapar.mx', 'Usuario Desarrollo', '', NULL, 'admin')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, last_name = EXCLUDED.last_name, user_type = EXCLUDED.user_type;
END $$;

-- 2) Usuario (cliente)
DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, email_change_token_current, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'usuario@escapar.mx', crypt('DevPass2025!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Usuario Cliente","last_name":"","user_type":"cliente"}'::jsonb, now(), now(), '', '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, format('{"sub":"%s","email":"usuario@escapar.mx","email_verified":true}', v_id)::jsonb, 'email', v_id::text, now(), now(), now());
  INSERT INTO public.profiles (id, email, full_name, last_name, phone, user_type)
  VALUES (v_id, 'usuario@escapar.mx', 'Usuario Cliente', '', NULL, 'cliente')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, last_name = EXCLUDED.last_name, user_type = EXCLUDED.user_type;
END $$;

-- 3) Partner
DO $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, email_change_token_current, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'partner@escapar.mx', crypt('DevPass2025!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Usuario Partner","last_name":"","user_type":"partner"}'::jsonb, now(), now(), '', '', '', '', '');
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, format('{"sub":"%s","email":"partner@escapar.mx","email_verified":true}', v_id)::jsonb, 'email', v_id::text, now(), now(), now());
  INSERT INTO public.profiles (id, email, full_name, last_name, phone, user_type)
  VALUES (v_id, 'partner@escapar.mx', 'Usuario Partner', '', NULL, 'partner')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, last_name = EXCLUDED.last_name, user_type = EXCLUDED.user_type;
END $$;

NOTIFY pgrst, 'reload schema';
