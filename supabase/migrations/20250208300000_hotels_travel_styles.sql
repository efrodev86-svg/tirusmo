-- Estilo de viaje: Romántico, Pareja, Amigos, Familiar (pueden seleccionar una o todas)
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS travel_styles text[] DEFAULT '{}';

COMMENT ON COLUMN public.hotels.travel_styles IS 'Estilos de viaje: Romántico, Pareja, Amigos, Familiar';
