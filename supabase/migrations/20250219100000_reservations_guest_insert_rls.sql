-- Asegurar que invitados (y cualquiera) puedan crear reservaciones sin sesión.
-- Soluciona: "new row violates row-level security policy for table reservations"

DROP POLICY IF EXISTS "Cualquiera puede crear reservación" ON public.reservations;

CREATE POLICY "Cualquiera puede crear reservación"
  ON public.reservations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
