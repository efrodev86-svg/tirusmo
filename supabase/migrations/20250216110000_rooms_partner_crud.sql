-- El partner puede gestionar habitaciones solo de su hotel (hotels.partner_id = auth.uid())

CREATE POLICY "Partner puede insertar habitaciones de su hotel"
  ON public.rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = rooms.hotel_id AND h.partner_id = auth.uid()
    )
  );

CREATE POLICY "Partner puede actualizar habitaciones de su hotel"
  ON public.rooms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = rooms.hotel_id AND h.partner_id = auth.uid()
    )
  );

CREATE POLICY "Partner puede eliminar habitaciones de su hotel"
  ON public.rooms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = rooms.hotel_id AND h.partner_id = auth.uid()
    )
  );
