-- Función para buscar IDs de reservaciones por término: id (completo o parcial) o por nombre/email del huésped.
-- Permite búsqueda parcial por ID (ej. "31ca6187").
CREATE OR REPLACE FUNCTION public.search_reservation_ids(p_search_term text)
RETURNS setof uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT r.id
  FROM public.reservations r
  WHERE (
    r.id::text ILIKE '%' || COALESCE(p_search_term, '') || '%'
    OR r.user_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.full_name ILIKE '%' || COALESCE(p_search_term, '') || '%'
         OR p.email ILIKE '%' || COALESCE(p_search_term, '') || '%'
    )
  );
$$;

-- Permiso para roles que usan la API
GRANT EXECUTE ON FUNCTION public.search_reservation_ids(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_reservation_ids(text) TO service_role;
