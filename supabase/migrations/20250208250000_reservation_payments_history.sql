-- Historial de pagos por reservación: monto y fecha de cada anticipo/abono.
-- Solo admins pueden ver e insertar (el cliente no ve esta tabla).
CREATE TABLE IF NOT EXISTS public.reservation_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  paid_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL DEFAULT 'anticipo' CHECK (type IN ('anticipo', 'abono', 'pago_final')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservation_payments_reservation_id ON public.reservation_payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_paid_at ON public.reservation_payments(paid_at);

ALTER TABLE public.reservation_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve historial de pagos"
  ON public.reservation_payments FOR SELECT
  USING (public.current_user_is_admin());

CREATE POLICY "Admin registra pagos"
  ON public.reservation_payments FOR INSERT
  WITH CHECK (public.current_user_is_admin());
