-- Rellena aleatoriamente estilos de viaje y pet friendly en hoteles existentes.
-- Cada hotel queda con un subconjunto aleatorio de estilos (al menos uno) y pet_friendly aleatorio (~45% true).

UPDATE public.hotels
SET
  pet_friendly = (random() < 0.45),
  travel_styles = COALESCE(
    (
      SELECT array_agg(style ORDER BY random())
      FROM unnest(ARRAY['Romántico', 'Pareja', 'Amigos', 'Familiar']::text[]) AS style
      WHERE random() > 0.4
    ),
    ARRAY['Familiar']::text[]
  );
