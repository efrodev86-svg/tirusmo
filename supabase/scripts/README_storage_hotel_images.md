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

## Bucket para habitaciones: `hotel-room-images`

Para la galería de imágenes en **Editar habitación** (Admin → Hoteles → Habitaciones → Editar):

1. En Storage → **New bucket**.
2. **Name:** `hotel-room-images`, **Public bucket:** activado.
3. Aplica la migración `supabase/migrations/20250220130000_room_images.sql` (tabla `room_images` y políticas de Storage).

Si aparece **"new row violates row-level security policy"** en la galería de habitaciones, ejecuta en SQL Editor el script **`supabase/scripts/fix_room_images_rls.sql`** y descomenta el `UPDATE` del paso 5 con tu email para asignarte rol admin.

---

## Error "new row violates row-level security policy" en producción

Las políticas exigen que el usuario sea **admin** (`profiles.user_type = 'admin'`). Si ves ese error:

1. Ejecuta el script **`supabase/scripts/fix_hotel_images_rls_production.sql`** en el SQL Editor del proyecto de producción.
2. Dentro del script, descomenta la línea del `UPDATE` y sustituye `'TU_EMAIL@ejemplo.com'` por el email del usuario que debe ser admin. Vuelve a ejecutar solo esa línea.
3. Asegúrate de que en la app el usuario **inicia sesión** (no uses solo la clave anon sin sesión) y que ese usuario tiene `user_type = 'admin'` en `public.profiles`.
