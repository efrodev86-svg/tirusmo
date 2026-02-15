-- Asigna "Sin plan de alimentos" (meal_plans vacío) a algunos hoteles.
-- Se actualizan ~5 hoteles seleccionados por ID para tener meal_plans = [].

UPDATE public.hotels
SET meal_plans = '[]'::jsonb
WHERE id IN (2, 6, 10, 14, 18);
