-- Pet friendly: hotel admite mascotas
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS pet_friendly boolean DEFAULT false;

COMMENT ON COLUMN public.hotels.pet_friendly IS 'Si el hotel admite mascotas (pet friendly)';
