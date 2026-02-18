-- El partner puede ver y actualizar reservaciones solo de su hotel (hotels.partner_id = auth.uid())

CREATE POLICY "Partner ve reservaciones de su hotel"
  ON public.reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = reservations.hotel_id AND h.partner_id = auth.uid()
    )
  );

CREATE POLICY "Partner actualiza reservaciones de su hotel"
  ON public.reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = reservations.hotel_id AND h.partner_id = auth.uid()
    )
  );
