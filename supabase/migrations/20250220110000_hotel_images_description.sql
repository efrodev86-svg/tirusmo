-- Descripción por imagen en la galería del hotel
ALTER TABLE public.hotel_images
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.hotel_images.description IS 'Descripción o pie de foto de la imagen.';
