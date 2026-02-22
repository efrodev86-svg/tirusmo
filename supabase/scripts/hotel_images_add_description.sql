-- Ejecuta en Supabase → SQL Editor (proyecto donde usas la galería).
-- Añade la columna description a hotel_images para que no falle "Could not find the 'description' column".
ALTER TABLE public.hotel_images
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.hotel_images.description IS 'Descripción o pie de foto de la imagen.';
