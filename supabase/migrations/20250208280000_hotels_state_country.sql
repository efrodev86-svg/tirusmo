-- Estado y país del hotel (ej. Querétaro, México)
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text;

COMMENT ON COLUMN public.hotels.state IS 'Estado o región del hotel (ej. Querétaro, CDMX).';
COMMENT ON COLUMN public.hotels.country IS 'País del hotel (ej. México).';
