-- Qué incluye el plan: lista por hotel (cada hotel puede definir sus propias inclusiones).
-- Estructura: [ { "title": "Habitaciones", "description": "Incluye las habitaciones de tu elección." }, ... ]
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS plan_inclusions jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.hotels.plan_inclusions IS 'Detalle de qué incluye el plan: array de { title, description }. Cada hotel define sus inclusiones.';
