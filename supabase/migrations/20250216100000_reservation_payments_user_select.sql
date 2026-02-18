-- El titular de la reserva puede ver el historial de pagos de sus propias reservaciones.
CREATE POLICY "Usuario ve pagos de sus reservaciones"
  ON public.reservation_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE reservations.id = reservation_payments.reservation_id
        AND reservations.user_id = auth.uid()
    )
  );
