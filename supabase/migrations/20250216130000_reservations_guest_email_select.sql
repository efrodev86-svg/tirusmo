-- Usuario puede ver reservaciones hechas como invitado si el guest_email coincide con su email (profiles).
-- Así, al registrarse después de una reserva como invitado, verá esa reserva en "Mis reservas".
CREATE POLICY "Usuario ve reservaciones invitado con su email"
  ON public.reservations
  FOR SELECT
  USING (
    user_id IS NULL
    AND data IS NOT NULL
    AND (data->>'guest_email') IS NOT NULL
    AND TRIM(data->>'guest_email') <> ''
    AND LOWER(TRIM(data->>'guest_email')) = LOWER(TRIM((
      SELECT email FROM public.profiles WHERE id = auth.uid() LIMIT 1
    )))
  );
