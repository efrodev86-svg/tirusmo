-- Teléfono de contacto del hotel
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN public.hotels.phone IS 'Teléfono de contacto del hotel';
