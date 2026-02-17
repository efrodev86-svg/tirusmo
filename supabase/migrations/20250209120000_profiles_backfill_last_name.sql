-- Rellenar apellidos a usuarios que no lo tienen: partir de full_name (texto después del primer espacio) o '—' si es una sola palabra
UPDATE public.profiles
SET last_name = CASE
  WHEN TRIM(COALESCE(full_name, '')) = '' THEN '—'
  WHEN POSITION(' ' IN TRIM(full_name)) > 0
    THEN TRIM(SUBSTRING(TRIM(full_name) FROM POSITION(' ' IN TRIM(full_name)) + 1))
  ELSE '—'
END
WHERE last_name IS NULL OR TRIM(COALESCE(last_name, '')) = '';
