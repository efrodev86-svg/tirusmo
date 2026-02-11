-- Asignar partner = usuario (profiles con user_type = 'partner')
-- Ejecuta en Supabase: SQL Editor → New query → Pegar → Run

ALTER TABLE public.hotels DROP CONSTRAINT IF EXISTS hotels_partner_id_fkey;
ALTER TABLE public.hotels DROP COLUMN IF EXISTS partner_id;
ALTER TABLE public.hotels ADD COLUMN partner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
