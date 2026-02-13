-- Notas internas del administrador por reservación. Solo admins pueden ver/crear/editar.
-- El cliente no tiene acceso a esta tabla (no hay política que lo permita).
CREATE TABLE IF NOT EXISTS public.reservation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'history', 'warning')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservation_notes_reservation_id ON public.reservation_notes(reservation_id);

ALTER TABLE public.reservation_notes ENABLE ROW LEVEL SECURITY;

-- Solo administradores pueden ver, insertar y actualizar notas. El cliente nunca las ve.
CREATE POLICY "Admin ve notas de reservaciones"
  ON public.reservation_notes FOR SELECT
  USING (public.current_user_is_admin());

CREATE POLICY "Admin crea notas de reservaciones"
  ON public.reservation_notes FOR INSERT
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Admin actualiza notas de reservaciones"
  ON public.reservation_notes FOR UPDATE
  USING (public.current_user_is_admin());

CREATE POLICY "Admin elimina notas de reservaciones"
  ON public.reservation_notes FOR DELETE
  USING (public.current_user_is_admin());
