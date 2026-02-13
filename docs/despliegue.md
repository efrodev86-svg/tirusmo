# Despliegue en producción

## Variables de entorno necesarias

En producción el build de Vite incluye las variables que existan **en el momento del build**. Configura estas variables en tu plataforma (Vercel, Netlify, etc.) **antes** de desplegar:

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase (ej. `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Sí | Clave anónima (pública) del proyecto Supabase |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Clave de Google Maps para mapa y autocompletado de direcciones en Admin → Editar hotel. Sin ella el mapa no se muestra en producción. |

### Cómo configurar `VITE_GOOGLE_MAPS_API_KEY` para que se vea el mapa

1. **Obtén la API key** en [Google Cloud Console](https://console.cloud.google.com/) → APIs y servicios → Credenciales. Habilita **Maps JavaScript API**, **Geocoding API** y **Places API**.
2. **En tu plataforma de despliegue**, añade la variable con el **mismo nombre** y el valor de la clave. Luego **vuelve a desplegar** (el build debe ejecutarse de nuevo para que Vite la incorpore).

#### Vercel

- Proyecto → **Settings** → **Environment Variables**
- Añadir: nombre `VITE_GOOGLE_MAPS_API_KEY`, valor `tu_clave_aqui`
- Marcar el entorno (Production, Preview, etc.)
- **Redeploy**: Deployments → ⋮ en el último deploy → Redeploy

#### Netlify (paso a paso)

1. Entra en [app.netlify.com](https://app.netlify.com), abre tu **site**.
2. Menú izquierdo: **Site configuration** → **Environment variables**.
3. Pulsa **Add a variable** → **Add a single variable**.
4. **Key:** `VITE_GOOGLE_MAPS_API_KEY` (cópialo tal cual; si falta `VITE_` el mapa no se incluirá en el build).
5. **Value:** pega tu API key de Google Maps (la misma que en tu `.env` local).
6. **Scopes:** deja marcado al menos **Production** (y si usas deploy previews, también **Deploy Previews**).
7. Guarda con **Create variable** o **Save**.
8. **Importante:** haz un deploy **limpiando la caché**, para que Netlify vuelva a hacer el build con la nueva variable:
   - Menú **Deploys** → botón **Trigger deploy** → **Clear cache and deploy site**.
   - O: **Site configuration** → **Build & deploy** → **Continuous deployment** → **Trigger deploy** → **Clear cache and deploy site**.

Si solo haces "Trigger deploy" sin limpiar caché, a veces el build reutiliza uno anterior y la variable no se aplica.

#### Otras plataformas

- Donde definas las variables de entorno del **build** (no solo runtime), añade `VITE_GOOGLE_MAPS_API_KEY` y ejecuta de nuevo el build/deploy.

3. **Restricciones de la API key (recomendado):** En Google Cloud, en la clave restringe por **referrer HTTP** y añade tu dominio de producción (ej. `https://tudominio.com/*`) para evitar uso no autorizado.
