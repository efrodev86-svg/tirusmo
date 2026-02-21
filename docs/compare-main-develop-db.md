# Comparación Main vs Develop (base de datos)

Comparación para diagnosticar **"Database error querying schema"** en develop.

## 1. Rol `authenticator`

| Proyecto | rolconfig | USAGE en storage |
|----------|-----------|-------------------|
| **Main** (beoxjsnxausupnabuqtg) | Sin `pgrst.db_schemas` (usa config del Dashboard) | No |
| **Develop** (xlvojvvteseejcxxfudn) | Llegó a tener `pgrst.db_schemas=public` o `public, storage` | **Sí** (tras aplicar fix) |

## 2. Causa del error

- Si `pgrst.db_schemas` incluye `storage` pero **authenticator** no tiene **USAGE** en el esquema `storage`, PostgREST falla al introspeccionar → "Database error querying schema".
- O si la configuración del rol no coincide con la del Dashboard.

## 3. Solución aplicada en develop (por MCP)

Se ejecutó:

```sql
GRANT USAGE ON SCHEMA storage TO authenticator;
ALTER ROLE authenticator RESET pgrst.db_schemas;
NOTIFY pgrst, 'reload schema';
```

- **GRANT USAGE**: permite a PostgREST leer el esquema `storage` si está en la config.
- **RESET pgrst.db_schemas**: deja que la configuración del Dashboard (Project Settings → API) vuelva a controlar qué esquemas expone PostgREST.

Si el error sigue: en el Dashboard de develop → **Project Settings → API** → botón **Reload schema** o **Restart project** (pausar y reanudar) para que PostgREST recargue con la nueva config.

---

## Tabla `public.profiles`

**Igual en ambos:** id, email, full_name, phone, user_type, created_at, updated_at, deleted_at, is_active, last_name.

---

## Tablas en `public`

| Tabla                 | Main | Develop |
|-----------------------|------|---------|
| amenity_catalog       | ✅   | ✅      |
| hotels                | ✅   | ✅      |
| **partners**          | ✅   | ❌ falta |
| profiles              | ✅   | ✅      |
| **reservation_notes** | ✅   | ❌ falta |
| **reservation_payments** | ✅ | ❌ falta |
| reservations          | ✅   | ✅      |
| rooms                 | ✅   | ✅      |

En develop faltan: `partners`, `reservation_notes`, `reservation_payments`. No suelen ser la causa del error de schema al login, pero conviene aplicar las migraciones que las crean si usas admin de reservaciones/pagos.

---

## Tabla `public.hotels` (columnas)

| Columna        | Main | Develop |
|----------------|------|---------|
| travel_styles  | ✅   | ❌      |
| pet_friendly  | ✅   | ❌      |
| plan_inclusions | ✅ | ❌      |
| phone         | ✅   | ✅      |
| (resto)        | ✅   | ✅      |

---

## Funciones en `public`

| Función                | Main | Develop |
|------------------------|------|---------|
| current_user_is_admin | ✅   | ✅      |
| handle_new_user       | ✅   | ✅      |
| insert_reservation_guest | ✅ | ✅   |
| **search_reservation_ids** | ✅ | ❌ falta |

---

## Políticas RLS en `profiles`

Main tiene una política duplicada de SELECT para admin: "Admin puede ver todos los perfiles" y "Admin ve todos los perfiles". Develop solo tiene "Admin puede ver todos los perfiles" (y "Admin puede actualizar cualquier perfil"). No afecta al error de schema.

---

## Resumen

1. **Para quitar "Database error querying schema" en develop:** ejecutar `fix_develop_schema_error.sql` (ALTER ROLE authenticator + NOTIFY).
2. Opcional: aplicar migraciones o scripts que creen `partners`, `reservation_notes`, `reservation_payments`, añadan a `hotels` las columnas `travel_styles`, `pet_friendly`, `plan_inclusions`, y creen la función `search_reservation_ids` para igualar develop a main.
