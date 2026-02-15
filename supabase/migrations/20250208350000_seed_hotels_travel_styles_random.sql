-- Asigna aleatoriamente estilos de viaje a todos los hoteles.
-- Cada hotel recibe un subconjunto aleatorio de estilos (al menos uno).
-- Estilos: Romántico, Pareja, Amigos, Familiar

UPDATE public.hotels
SET travel_styles = COALESCE(
  (
    SELECT array_agg(style ORDER BY random())
    FROM unnest(ARRAY['Romántico', 'Pareja', 'Amigos', 'Familiar']::text[]) AS style
    WHERE random() > 0.4
  ),
  ARRAY['Familiar']::text[]
);
