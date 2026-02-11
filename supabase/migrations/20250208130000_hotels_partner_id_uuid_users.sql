-- Partners como usuarios: hotel.partner_id apunta al usuario (profiles/auth)
-- Ejecutar en Supabase SQL Editor si no usas CLI

-- Quitar partner_id que apuntaba a partners(id) y usar auth.users(id)
ALTER TABLE public.hotels DROP CONSTRAINT IF EXISTS hotels_partner_id_fkey;
ALTER TABLE public.hotels DROP COLUMN IF EXISTS partner_id;
ALTER TABLE public.hotels ADD COLUMN partner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
