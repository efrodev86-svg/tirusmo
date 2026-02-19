-- 1) Política INSERT aplicada a todos los roles (PUBLIC)
DROP POLICY IF EXISTS "Cualquiera puede crear reservación" ON public.reservations;
CREATE POLICY "Cualquiera puede crear reservación"
  ON public.reservations
  FOR INSERT
  WITH CHECK (true);

-- 2) Función que inserta la reserva como definer (bypasea RLS) y devuelve el id
-- para reservas como invitado y evitar error RLS en INSERT directo
CREATE OR REPLACE FUNCTION public.insert_reservation_guest(
  p_user_id uuid,
  p_hotel_id bigint,
  p_room_id bigint,
  p_check_in date,
  p_check_out date,
  p_total numeric,
  p_guests int,
  p_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.reservations (
    user_id, hotel_id, room_id, check_in, check_out, total, status, guests, amount_paid, data
  ) VALUES (
    p_user_id, p_hotel_id, p_room_id, p_check_in, p_check_out, p_total, 'PENDIENTE', p_guests, 0, COALESCE(p_data, '{}'::jsonb)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.insert_reservation_guest IS 'Permite crear una reservación (invitado o usuario). Usar desde el cliente cuando el INSERT directo falle por RLS.';

GRANT EXECUTE ON FUNCTION public.insert_reservation_guest(uuid, bigint, bigint, date, date, numeric, int, jsonb)
  TO anon, authenticated;
