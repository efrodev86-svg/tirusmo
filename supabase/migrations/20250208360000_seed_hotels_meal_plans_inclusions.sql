-- Agrega información de planes (meal_plans y plan_inclusions) a todos los hoteles que no la tienen.

-- 1. Hoteles sin meal_plans o con array vacío: asignar Desayuno y Todo incluido con costos basados en el precio del hotel
UPDATE public.hotels
SET meal_plans = jsonb_build_array(
  jsonb_build_object(
    'type', 'desayuno',
    'cost', LEAST(200, GREATEST(80, ROUND(price * 0.12)::numeric)),
    'cost_children', LEAST(120, GREATEST(50, ROUND(price * 0.08)::numeric))
  ),
  jsonb_build_object(
    'type', 'todo_incluido',
    'cost', LEAST(900, GREATEST(400, ROUND(price * 0.55)::numeric)),
    'cost_children', LEAST(600, GREATEST(280, ROUND(price * 0.4)::numeric))
  )
)
WHERE meal_plans IS NULL
   OR meal_plans = '[]'::jsonb
   OR jsonb_array_length(COALESCE(meal_plans, '[]'::jsonb)) = 0;

-- 2. Hoteles con plan Todo incluido pero sin plan_inclusions: asignar inclusiones por defecto
UPDATE public.hotels
SET plan_inclusions = '[
  {"title": "Habitaciones", "description": "Incluye las habitaciones de tu elección según disponibilidad."},
  {"title": "Alimentos y Bebidas", "description": "Desayuno, comida y cena en restaurantes del resort. Bebidas nacionales ilimitadas."},
  {"title": "Actividades", "description": "Acceso a albercas, playa y actividades recreativas del hotel."},
  {"title": "Entretenimiento", "description": "Shows y animación nocturna según programación."}
]'::jsonb
WHERE (meal_plans::text LIKE '%todo_incluido%')
  AND (plan_inclusions IS NULL OR plan_inclusions = '[]'::jsonb OR jsonb_array_length(COALESCE(plan_inclusions, '[]'::jsonb)) = 0);
