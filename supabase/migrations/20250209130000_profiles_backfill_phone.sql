-- Asignar número de teléfono de ejemplo a usuarios que no tienen
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM public.profiles
  WHERE phone IS NULL OR TRIM(COALESCE(phone, '')) = ''
)
UPDATE public.profiles p
SET phone = '+52 55 1' || LPAD((n.rn)::text, 3, '0') || ' ' || LPAD(((n.rn * 111) % 10000)::text, 4, '0')
FROM numbered n
WHERE p.id = n.id;
