-- Planes de comida del hotel: desayuno, comida, cena, todo incluido, con costo por plan.
-- Estructura: [ { "type": "desayuno", "cost": 150 }, { "type": "todo_incluido", "cost": 600 } ]
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS meal_plans jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.hotels.meal_plans IS 'Planes de comida ofrecidos: array de { type: desayuno|comida|cena|todo_incluido, cost: number }. cost en la moneda del hotel.';
