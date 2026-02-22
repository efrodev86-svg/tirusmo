-- Ejecuta en Supabase → SQL Editor si la galería falla por columnas url_medium/url_small.
-- Añade las columnas para los tamaños mediano y pequeño de cada imagen.
ALTER TABLE public.hotel_images
  ADD COLUMN IF NOT EXISTS url_medium text,
  ADD COLUMN IF NOT EXISTS url_small text;

COMMENT ON COLUMN public.hotel_images.url_medium IS 'URL de la versión mediana (ej. 420x280, mismas proporciones que la grande).';
COMMENT ON COLUMN public.hotel_images.url_small IS 'URL de la versión miniatura (ej. 50x50).';
