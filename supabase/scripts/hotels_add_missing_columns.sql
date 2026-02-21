-- Añade todas las columnas de hoteles que puede esperar la app (Admin → Registrar hotel).
-- Ejecuta este script en el proyecto de Supabase donde falten (ej. branch develop).
-- Es idempotente: ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS municipality text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '15:00',
  ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '11:00',
  ADD COLUMN IF NOT EXISTS meal_plans jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS travel_styles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pet_friendly boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_inclusions jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.hotels.phone IS 'Teléfono de contacto del hotel';
COMMENT ON COLUMN public.hotels.municipality IS 'Municipio o alcaldía del hotel';
COMMENT ON COLUMN public.hotels.state IS 'Estado o región del hotel';
COMMENT ON COLUMN public.hotels.country IS 'País del hotel';
COMMENT ON COLUMN public.hotels.check_in_time IS 'Hora de entrada (ej. 15:00)';
COMMENT ON COLUMN public.hotels.check_out_time IS 'Hora de salida (ej. 11:00)';
COMMENT ON COLUMN public.hotels.meal_plans IS 'Planes de comida: array de { type, cost }';
COMMENT ON COLUMN public.hotels.travel_styles IS 'Estilos de viaje: Romántico, Pareja, etc.';
COMMENT ON COLUMN public.hotels.pet_friendly IS 'Si el hotel admite mascotas';
COMMENT ON COLUMN public.hotels.plan_inclusions IS 'Inclusiones del plan: array de { title, description }';
