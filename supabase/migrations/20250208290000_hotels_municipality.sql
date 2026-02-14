-- Municipio del hotel (ej. Benito Juárez, Querétaro)
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS municipality text;

COMMENT ON COLUMN public.hotels.municipality IS 'Municipio o alcaldía del hotel (ej. Benito Juárez, Querétaro).';
