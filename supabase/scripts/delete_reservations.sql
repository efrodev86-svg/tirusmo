-- Ejecuta en Supabase (SQL Editor) para borrar todas las reservaciones.
-- Después puedes volver a ejecutar seed_reservations.sql para crear 100 nuevas.

DELETE FROM public.reservations;

-- Comprobar que quedaron en 0
SELECT COUNT(*) AS total_reservaciones FROM public.reservations;
