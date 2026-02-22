-- URLs de tamaños mediano y pequeño para cada imagen (grande = url existente).
ALTER TABLE public.hotel_images
  ADD COLUMN IF NOT EXISTS url_medium text,
  ADD COLUMN IF NOT EXISTS url_small text;

COMMENT ON COLUMN public.hotel_images.url_medium IS 'URL de la versión mediana (ej. 420x280, mismas proporciones que la grande).';
COMMENT ON COLUMN public.hotel_images.url_small IS 'URL de la versión miniatura (ej. 50x50).';
