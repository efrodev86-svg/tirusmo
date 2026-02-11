-- Ejecuta este script en Supabase (SQL Editor) para crear 100 reservaciones de prueba.
-- Reparte las reservaciones entre distintos usuarios (profiles) y con distintos estatus.
-- Requiere: al menos 1 usuario en public.profiles, hoteles y habitaciones en hotels/rooms.

WITH
  -- Perfiles numerados para repartir entre usuarios
  perfiles AS (
    SELECT id, row_number() OVER () AS rn
    FROM public.profiles
  ),
  num_perfiles AS (
    SELECT COUNT(*) AS total FROM public.profiles
  ),
  -- Estatus numerados: reparto ~PENDIENTE 15%, CONFIRMADA 45%, CHECKOUT 20%, CANCELADA 20%
  estatus_opciones AS (
    SELECT s, row_number() OVER () AS rn
    FROM (VALUES
      ('PENDIENTE'),
      ('CONFIRMADA'), ('CONFIRMADA'), ('CONFIRMADA'),
      ('CHECKOUT'), ('CHECKOUT'),
      ('CANCELADA'), ('CANCELADA')
    ) AS t(s)
  ),
  num_estatus AS (SELECT COUNT(*) AS total FROM estatus_opciones),
  -- 100 combinaciones hotel-habitación
  hr AS (
    SELECT
      h.id AS hotel_id,
      r.id AS room_id,
      r.price,
      row_number() OVER () AS rn
    FROM public.hotels h
    JOIN public.rooms r ON r.hotel_id = h.id
    ORDER BY RANDOM()
    LIMIT 100
  )
INSERT INTO public.reservations (user_id, hotel_id, room_id, check_in, check_out, total, status, guests)
SELECT
  (SELECT p.id FROM perfiles p WHERE p.rn = ((hr.rn - 1) % (SELECT total FROM num_perfiles)) + 1),
  hr.hotel_id,
  hr.room_id,
  (CURRENT_DATE - (30 + (random() * 120))::int)::date,
  (CURRENT_DATE - (30 + (random() * 120))::int + (1 + (random() * 5))::int)::date,
  (hr.price * (1 + (random() * 4))::int)::numeric(10,2),
  (SELECT e.s FROM estatus_opciones e WHERE e.rn = ((hr.rn - 1) % (SELECT total FROM num_estatus)) + 1),
  (1 + (random() * 4))::int
FROM hr
WHERE (SELECT total FROM num_perfiles) > 0
  AND (SELECT COUNT(*) FROM public.reservations) < 100;

-- Resumen por estatus y por usuario
SELECT 'Por estatus' AS resumen;
SELECT status, COUNT(*) AS cantidad FROM public.reservations GROUP BY status ORDER BY status;

SELECT 'Por usuario (últimas reservaciones)' AS resumen;
SELECT user_id, COUNT(*) AS reservaciones
FROM public.reservations
GROUP BY user_id
ORDER BY reservaciones DESC;

SELECT COUNT(*) AS total_reservaciones FROM public.reservations;
