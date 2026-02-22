# Pasar cambios de develop a main sin perder datos de main

Objetivo: aplicar en **main** solo los **cambios de esquema** (tablas, columnas, políticas, funciones) que hiciste en **develop**, **sin borrar ni sobrescribir datos** de main.

## Regla de oro

En main solo ejecutar cambios **aditivos**:
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `CREATE TABLE IF NOT EXISTS`
- `CREATE POLICY` (o `DROP POLICY IF EXISTS` + `CREATE POLICY`)
- `CREATE OR REPLACE FUNCTION`
- `CREATE INDEX IF NOT EXISTS`

No ejecutar en main (o revisar con cuidado):
- `DROP TABLE`, `TRUNCATE`, `DELETE` sin `WHERE`
- Migraciones que borren columnas o datos

---

## Opción 1: Migraciones del repo (recomendado)

1. **Comparar qué migraciones tiene main y cuáles develop**  
   En el Dashboard: main → Database → Migrations. Develop → igual. O con MCP: `list_migrations` para cada `project_id`.

2. **En tu máquina, enlazar a main y aplicar migraciones pendientes**  
   Si usas Supabase CLI y tienes las migraciones en `supabase/migrations/`:
   ```bash
   # En .env o en link, usar project ref de MAIN
   supabase link --project-ref beoxjsnxausupnabuqtg
   supabase db push
   ```
   `db push` aplica solo las migraciones que **aún no están** en main. No borra datos si las migraciones son aditivas.

3. **Si no usas CLI:** copiar el contenido de cada archivo de migración que falte en main (por orden de fecha en el nombre) y ejecutarlo en **SQL Editor del proyecto main**. Usar siempre `IF NOT EXISTS` donde aplique.

---

## Opción 2: Cambios hechos a mano en develop

Si en develop ejecutaste SQL a mano (sin migración en el repo):

1. **Exportar ese SQL** (lo que corriste en develop).
2. **Revisar** que no tenga `DROP TABLE`, `TRUNCATE` ni `DELETE` sin condiciones.
3. **Ajustar** a “idempotente”: usar `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, etc.
4. **Ejecutar** ese SQL en el **SQL Editor del proyecto main**.

---

## Opción 3: Merge de rama (Supabase Branches)

Si main y develop son **branches** del mismo proyecto en Supabase:

- En Dashboard: **Branches** → seleccionar develop → **Merge into main** (o el flujo que muestre la UI).  
- Revisa la documentación de Supabase: a veces el merge aplica migraciones del branch; confirma si hace solo cambios de esquema o también puede afectar datos.

---

## Estado actual (resumen)

- **Main** (beoxjsnxausupnabuqtg): 24 migraciones aplicadas.
- **Develop** (xlvojvvteseejcxxfudn): 26 migraciones; 2 de más respecto a main:
  - `reservations_add_structured_columns`
  - `reservations_select_policies`

Para igualar esquema sin tocar datos de main: aplicar en main solo el **contenido** de esas dos migraciones (o las que correspondan en tu repo), en orden, usando siempre cláusulas seguras (`IF NOT EXISTS`, etc.).

---

## Después de aplicar cambios en main

1. En Dashboard de main: **Project Settings → API** → “Reload schema” si existe.
2. Probar en producción que login, reservas y listados sigan funcionando.
