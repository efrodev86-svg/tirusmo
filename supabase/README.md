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

---

## Cómo llevar cambios de la base de desarrollo a producción

Las migraciones están en **`supabase/migrations/`** (y en Git). No se “fusionan” dos bases: aplicas **las mismas migraciones** primero en desarrollo y luego en producción.

### Flujo recomendado

1. **En desarrollo**  
   Creas o editas archivos en `supabase/migrations/` (ej. `20250220100000_mi_cambio.sql`) y los aplicas al **proyecto Supabase de desarrollo** (Dashboard → proyecto dev → SQL Editor, o CLI/MCP contra ese proyecto).

2. **Subes el código**  
   Haces commit y push de las migraciones (y del código que las usa) a tu rama; cuando esté listo, merge a `main`.

3. **En producción**  
   Aplicas **solo las migraciones nuevas** al **proyecto Supabase de producción**. Opciones:

   - **Dashboard (SQL Editor)**  
     Entra al proyecto de **producción** → SQL Editor → New query. Copia el contenido de cada migración nueva (por orden de fecha en el nombre) y ejecuta **Run**. Repite para cada archivo que aún no hayas aplicado en prod.

   - **Supabase CLI**  
     Enlaza el proyecto de producción y aplica migraciones pendientes:
     ```bash
     npx supabase link --project-ref <PROJECT_REF_PRODUCCION>
     npx supabase db push
     ```
     (`db push` aplica las migraciones que aún no están en la base enlazada.)

   - **Supabase MCP (Cursor)**  
     Usa la herramienta `apply_migration` indicando el **project_id de producción** y el SQL de la migración.

### Orden importante

- Aplica las migraciones en el **mismo orden** que los nombres (por timestamp: `20250216130000_...` antes que `20250219100000_...`).
- En producción, solo aplica migraciones que ya probaste en desarrollo.
- Si una migración falla en producción, no sigas con las siguientes hasta corregir (o revertir) esa migración.

---

## Cómo deshacer una migración

Supabase **no tiene rollback automático**. Para “deshacer” una migración tienes que ejecutar el **SQL inverso** manualmente (en el SQL Editor del Dashboard, con la CLI o con MCP).

### Reglas generales

- **Políticas RLS:** la migración hace `CREATE POLICY ...` → para deshacer: `DROP POLICY "nombre_exacto" ON public.tabla;`
- **Columnas:** la migración hace `ALTER TABLE ... ADD COLUMN x` → para deshacer: `ALTER TABLE ... DROP COLUMN x;` (ojo: pierdes los datos de esa columna).
- **Tablas:** la migración hace `CREATE TABLE ...` → para deshacer: `DROP TABLE ...;` (pierdes la tabla y sus datos).
- **Funciones:** `CREATE OR REPLACE FUNCTION ...` → para deshacer: `DROP FUNCTION nombre(args);`

### Ejemplo: deshacer una política

Si la migración fue:

```sql
CREATE POLICY "Usuario ve reservaciones invitado con su email"
  ON public.reservations FOR SELECT USING (...);
```

Para deshacerla ejecuta:

```sql
DROP POLICY IF EXISTS "Usuario ve reservaciones invitado con su email" ON public.reservations;
```

### Buenas prácticas

1. **Antes de deshacer en producción:** haz backup o comprueba que tienes forma de recuperar si algo sale mal.
2. **Scripts “down”:** en una carpeta `supabase/migrations_down/` o en un doc puedes guardar el SQL que revierte cada migración (por ejemplo `20250216130000_reservations_guest_email_select_down.sql`), así siempre sabes qué ejecutar para deshacer.
3. **Orden al deshacer:** si deshaces una migración, suele ser en orden **inverso** al que aplicaste (primero la última que aplicaste, luego la anterior, etc.).

### Sobre el historial de migraciones

El historial de migraciones aplicadas (por ejemplo en `supabase_migrations.schema_migrations`) solo registra qué se aplicó; no ejecuta nada al “deshacer”. Quitar una fila de ese historial **no** revierte los cambios en la base: siempre hay que ejecutar el SQL inverso a mano.
