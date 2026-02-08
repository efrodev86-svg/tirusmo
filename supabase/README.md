# Supabase – Cómo crear las tablas

Proyecto: **beoxjsnxausupnabuqtg**

## Opción 1: SQL Editor en el Dashboard (recomendado)

1. Entra en [Supabase Dashboard](https://supabase.com/dashboard/project/beoxjsnxausupnabuqtg).
2. Abre **SQL Editor** → **New query**.
3. Copia y pega todo el contenido de **`schema.sql`**.
4. Pulsa **Run**.

## Opción 2: Supabase MCP en Cursor

Si tienes el [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) configurado en Cursor:

1. Abre un chat con el agente.
2. Pide: *"Ejecuta el SQL del archivo `supabase/schema.sql` en mi proyecto de Supabase usando MCP"*.

El MCP puede usar la herramienta `execute_sql` para aplicar el contenido de `schema.sql`.

## Opción 3: Supabase CLI

```bash
# Enlazar proyecto (te pedirá la contraseña de la base de datos)
npx supabase link --project-ref beoxjsnxausupnabuqtg

# Aplicar migraciones
npx supabase db push
```

La contraseña de la base de datos está en: **Dashboard → Settings → Database**.

---

Tras aplicar el SQL quedarán creadas:

- **hotels** – hoteles para la búsqueda y reservas
- **reservations** – reservas (payload en `data` jsonb)
- **profiles** – perfiles de usuario (cliente/partner/admin) y trigger al registrarse
