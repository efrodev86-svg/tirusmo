# Bucket de Storage para galería de hoteles

Para que la **Galería de imágenes** (Admin → Hoteles → Editar hotel) funcione:

1. En el [Dashboard de Supabase](https://supabase.com/dashboard) → tu proyecto → **Storage**.
2. Pulsa **New bucket**.
3. **Name:** `hotel-images` (tiene que ser exactamente este nombre).
4. Activa **Public bucket** (para que las imágenes se vean en la ficha del hotel).
5. Crea el bucket.

Luego aplica la migración que crea la tabla `hotel_images` y las políticas de Storage:

- `supabase/migrations/20250220100000_hotel_images.sql`

(En SQL Editor o con `supabase db push`.)
