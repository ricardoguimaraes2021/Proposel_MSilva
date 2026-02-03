-- Seed basico: 1 categoria + 1 servico
-- Executar no SQL Editor do Supabase

WITH new_category AS (
  INSERT INTO service_categories (
    name_pt,
    name_en,
    description_pt,
    description_en,
    icon,
    sort_order,
    is_active
  )
  VALUES (
    'Menus de Refeicao',
    'Meal Menus',
    'Menus completos para eventos.',
    'Full menus for events.',
    'utensils',
    1,
    true
  )
  RETURNING id
)
INSERT INTO services (
  category_id,
  name_pt,
  name_en,
  description_pt,
  description_en,
  pricing_type,
  base_price,
  unit_pt,
  unit_en,
  min_quantity,
  max_quantity,
  sort_order,
  is_active,
  tags
)
SELECT
  new_category.id,
  'Menu Premium',
  'Premium Menu',
  'Servico de catering completo com entradas, prato principal e sobremesa.',
  'Full catering service with starters, main course, and dessert.',
  'per_person',
  85.00,
  'pessoa',
  'person',
  1,
  NULL,
  1,
  true,
  ARRAY['premium','casamento']
FROM new_category;
