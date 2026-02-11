-- Reservaciones: columnas estructuradas para admin y listado
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hotel_id bigint REFERENCES public.hotels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS room_id bigint REFERENCES public.rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS check_in date,
  ADD COLUMN IF NOT EXISTS check_out date,
  ADD COLUMN IF NOT EXISTS total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'CONFIRMADA', 'CHECKOUT', 'CANCELADA')),
  ADD COLUMN IF NOT EXISTS guests int NOT NULL DEFAULT 1;

-- Admin puede ver y actualizar todas las reservaciones; usuarios ven las suyas
DROP POLICY IF EXISTS "Cualquiera puede crear reservación" ON public.reservations;
CREATE POLICY "Cualquiera puede crear reservación" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin ve todas las reservaciones" ON public.reservations FOR SELECT USING (public.current_user_is_admin());
CREATE POLICY "Usuario ve sus reservaciones" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin actualiza reservaciones" ON public.reservations FOR UPDATE USING (public.current_user_is_admin());

-- Habitaciones para hoteles que no tienen (solo primer hotel tenía seed)
INSERT INTO public.rooms (hotel_id, name, type, price, status, image, amenities)
SELECT h.id, r.name, r.type, r.price, r.status, r.image, r.amenities
FROM public.hotels h
CROSS JOIN (VALUES
  ('Habitación Doble', 'ESTÁNDAR', 120, 'DISPONIBLE', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400', '["Wifi","Clima"]'::jsonb),
  ('Habitación King', 'ESTÁNDAR', 150, 'DISPONIBLE', 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=400', '["Wifi","Café"]'::jsonb),
  ('Suite Junior', 'SUITE', 220, 'DISPONIBLE', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=400', '["Wifi","Balcón"]'::jsonb),
  ('Doble Vista', 'DOBLE DELUXE', 180, 'DISPONIBLE', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400', '["Wifi","Minibar"]'::jsonb),
  ('Estándar', 'ESTÁNDAR', 100, 'DISPONIBLE', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400', '["Wifi"]'::jsonb)
) AS r(name, type, price, status, image, amenities)
WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE hotel_id = h.id)
AND h.id > (SELECT MIN(id) FROM public.hotels);

-- 100 reservaciones de ejemplo: repartidas entre usuarios y con distintos estatus
WITH
  perfiles AS (SELECT id, row_number() OVER () AS rn FROM public.profiles),
  num_perfiles AS (SELECT COUNT(*) AS total FROM public.profiles),
  estatus_opciones AS (
    SELECT s, row_number() OVER () AS rn
    FROM (VALUES ('PENDIENTE'), ('CONFIRMADA'), ('CONFIRMADA'), ('CONFIRMADA'), ('CHECKOUT'), ('CHECKOUT'), ('CANCELADA'), ('CANCELADA')) AS t(s)
  ),
  num_estatus AS (SELECT COUNT(*) AS total FROM estatus_opciones),
  hr AS (
    SELECT h.id AS hotel_id, r.id AS room_id, r.price, row_number() OVER () AS rn
    FROM public.hotels h
    JOIN public.rooms r ON r.hotel_id = h.id
    ORDER BY RANDOM()
    LIMIT 100
  )
INSERT INTO public.reservations (user_id, hotel_id, room_id, check_in, check_out, total, status, guests)
SELECT
  (SELECT p.id FROM perfiles p WHERE p.rn = ((hr.rn - 1) % (SELECT total FROM num_perfiles)) + 1),
  hr.hotel_id, hr.room_id,
  (CURRENT_DATE - (30 + (random() * 120))::int)::date,
  (CURRENT_DATE - (30 + (random() * 120))::int + (1 + (random() * 5))::int)::date,
  (hr.price * (1 + (random() * 4))::int)::numeric(10,2),
  (SELECT e.s FROM estatus_opciones e WHERE e.rn = ((hr.rn - 1) % (SELECT total FROM num_estatus)) + 1),
  (1 + (random() * 4))::int
FROM hr
WHERE (SELECT total FROM num_perfiles) > 0 AND (SELECT COUNT(*) FROM public.reservations) < 100;
