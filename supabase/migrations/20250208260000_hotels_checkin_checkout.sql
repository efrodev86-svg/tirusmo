-- Horarios de check-in y check-out del hotel (ej. 15:00 y 11:00).
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '15:00',
  ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '11:00';

COMMENT ON COLUMN public.hotels.check_in_time IS 'Hora de entrada (formato HH:MM, ej. 15:00).';
COMMENT ON COLUMN public.hotels.check_out_time IS 'Hora de salida (formato HH:MM, ej. 11:00).';
