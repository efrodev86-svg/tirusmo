# Comparación de usuarios efro.dev86@gmail.com vs dev@escapar.mx (develop)

Comparación en la base de datos **develop** (xlvojvvteseejcxxfudn) para diagnosticar por qué uno entra y el otro marca "Database error querying schema".

## auth.users

| Campo | efro.dev86@gmail.com | dev@escapar.mx |
|-------|----------------------|----------------|
| id | f10b9d9f-40aa-459a-9e16-502574493eb1 | 73e5f219-559d-40cb-98ac-b601e928c725 |
| email | efro.dev86@gmail.com | dev@escapar.mx |
| raw_user_meta_data | full_name, last_name, phone, user_type (cliente), email_verified, phone_verified | full_name, last_name, user_type (admin) |
| created_at | 2026-02-21 04:57:46 | 2026-02-21 04:38:03 |

## public.profiles

| Campo | efro.dev86@gmail.com | dev@escapar.mx |
|-------|----------------------|----------------|
| id | f10b9d9f-... | 73e5f219-... |
| email | efro.dev86@gmail.com | dev@escapar.mx |
| full_name | efroDev Developer | Usuario Desarrollo |
| last_name | Developer | "" |
| phone | +52 5544332211 | null |
| user_type | cliente | admin |
| is_active | true | true |
| deleted_at | null | null |
| created_at | 2026-02-21 04:57:46 | 2026-02-21 04:38:03 |

## auth.identities

Ambos tienen identidad `email` con `provider_id` = su mismo `user_id`. Estructura correcta en los dos.

## Conclusión

- **No hay diferencia de estructura** entre los dos usuarios: mismos campos en `auth.users` y en `public.profiles`.
- **La consulta de login** (SELECT user_type FROM profiles WHERE id = ?) es la misma para ambos; en pruebas directas en la base, los dos pueden leer su fila en `profiles` con el rol `authenticated`.

Por tanto, el error **"Database error querying schema"** no se debe a datos distintos de estos usuarios, sino a algo del **API/PostgREST** (p. ej. caché de esquema, orden de peticiones o momento en que se hace la primera petición tras el login).

## Qué hacer

1. **Fallback en Login:** Si el error contiene "schema" o "database" + "querying", el login ya usa `user_metadata.user_type` y deja entrar (incluido admin). Asegúrate de tener la última versión del `Login.tsx` con ese fallback.
2. **Probar de nuevo con dev@escapar.mx:** Recarga la app (F5), inicia sesión con dev@escapar.mx; si aparece el error, el fallback debería enviarte al dashboard de admin igualmente.
3. **Si aun así no entra:** El error podría estar ocurriendo **después** del login (p. ej. al cargar el dashboard de admin y hacer la petición que lista usuarios). En ese caso, conviene recargar esquema o reiniciar el proyecto en el Dashboard de Supabase (develop) para refrescar PostgREST.
