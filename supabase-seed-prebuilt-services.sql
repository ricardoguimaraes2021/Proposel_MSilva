-- Seed pre-construido para servicos de casamento (menus, bebidas e bartender)
-- Idempotente: nao duplica servicos existentes

WITH
menu_category AS (
  SELECT id FROM service_categories WHERE name_pt = 'Menus de Refeicao' LIMIT 1
),
menu_insert AS (
  INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order)
  SELECT 'Menus de Refeicao', 'Meal Menus', 'Menus completos para eventos.', 'Full menus for events.', 1
  WHERE NOT EXISTS (SELECT 1 FROM menu_category)
  RETURNING id
),
menu AS (
  SELECT id FROM menu_insert
  UNION ALL
  SELECT id FROM menu_category
),
beverages_category AS (
  SELECT id FROM service_categories WHERE name_pt = 'Bebidas' LIMIT 1
),
beverages_insert AS (
  INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order)
  SELECT 'Bebidas', 'Beverages', 'Servicos de bebidas e bar.', 'Beverage services.', 2
  WHERE NOT EXISTS (SELECT 1 FROM beverages_category)
  RETURNING id
),
beverages AS (
  SELECT id FROM beverages_insert
  UNION ALL
  SELECT id FROM beverages_category
),
bartender_category AS (
  SELECT id FROM service_categories WHERE name_pt = 'Bartender' LIMIT 1
),
bartender_insert AS (
  INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order)
  SELECT 'Bartender', 'Bartender', 'Servico de cocktails e bar.', 'Cocktail service.', 3
  WHERE NOT EXISTS (SELECT 1 FROM bartender_category)
  RETURNING id
),
bartender AS (
  SELECT id FROM bartender_insert
  UNION ALL
  SELECT id FROM bartender_category
),
extras_category AS (
  SELECT id FROM service_categories WHERE name_pt = 'Extras' LIMIT 1
),
extras_insert AS (
  INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order)
  SELECT 'Extras', 'Extras', 'Servicos adicionais opcionais.', 'Optional extra services.', 4
  WHERE NOT EXISTS (SELECT 1 FROM extras_category)
  RETURNING id
),
extras AS (
  SELECT id FROM extras_insert
  UNION ALL
  SELECT id FROM extras_category
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
  included_items_pt,
  included_items_en,
  tags,
  sort_order,
  is_active
)
SELECT
  menu.id,
  'Buffet Casamento - Opcao A',
  'Wedding Buffet - Option A',
  'Buffet com entradas, prato principal e sobremesas (opcao A).',
  'Buffet with starters, main course, and desserts (option A).',
  'per_person',
  75.00,
  'pessoa',
  'person',
  ARRAY[
    'Entradas Buffet (Welcome Food): Rissois, croquetes, empadas, bolinhos de bacalhau, enchidos, rodoes, moelas, mexilhao, camarao, wraps, saladas frias, tabuas de queijos e enchidos, pao, broa, pates e fritos variados.',
    'Lista de pratos: Bacalhau com natas, bacalhau assado com broa, bacalhau a Bras, arroz de pato, vitela estufada, lombo assado, leitao, arroz de tamboril, grelhada mista, opcao vegetariana ou vegan.',
    'Sobremesas Buffet: Cheesecake, tarte de amendoa, bolo de bolacha, pudim, bolo de chocolate, mini sobremesas, tabua de queijo e marmelada, fruta laminada.',
    'Bebidas Incluidas: Agua, refrigerantes, sumos, vinho branco e tinto, cerveja, cafe, espumante para corte do bolo e digestivos.'
  ],
  ARRAY[
    'Welcome Food: Rissois, croquettes, empadas, codfish fritters, sausages, pork bites, mussels, shrimp, wraps, cold salads, cheese and charcuterie boards, bread, cornbread, pates, assorted fritters.',
    'Main dishes: Cod with cream, cod with cornbread, cod a Bras, duck rice, beef stew, roasted loin, suckling pig, monkfish rice, mixed grill, vegetarian or vegan option.',
    'Dessert buffet: Cheesecake, almond tart, biscuit cake, pudding, chocolate cake, mini desserts, cheese board and quince, sliced fruit.',
    'Beverages included: Water, soft drinks, juices, white and red wine, beer, coffee, sparkling wine for cake, digestifs.'
  ],
  ARRAY['casamento','buffet','group:buffet-casamento'],
  1,
  true
FROM menu
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Buffet Casamento - Opcao A' AND s.category_id = menu.id
)
UNION ALL
SELECT
  menu.id,
  'Buffet Casamento - Opcao B1',
  'Wedding Buffet - Option B1',
  'Servico a mesa com 1 prato (opcao B1).',
  'Plated service with 1 main dish (option B1).',
  'per_person',
  85.00,
  'pessoa',
  'person',
  ARRAY[
    'Entradas Buffet (Welcome Food): Rissois, croquetes, empadas, bolinhos de bacalhau, enchidos, rodoes, moelas, mexilhao, camarao, wraps, saladas frias, tabuas de queijos e enchidos, pao, broa, pates e fritos variados.',
    'Servico a mesa com 1 prato.',
    'Lista de pratos: Bacalhau com natas, bacalhau assado com broa, bacalhau a Bras, arroz de pato, vitela estufada, lombo assado, leitao, arroz de tamboril, grelhada mista, opcao vegetariana ou vegan.',
    'Sobremesas Buffet: Cheesecake, tarte de amendoa, bolo de bolacha, pudim, bolo de chocolate, mini sobremesas, tabua de queijo e marmelada, fruta laminada.',
    'Bebidas Incluidas: Agua, refrigerantes, sumos, vinho branco e tinto, cerveja, cafe, espumante para corte do bolo e digestivos.'
  ],
  ARRAY[
    'Welcome Food: Rissois, croquettes, empadas, codfish fritters, sausages, pork bites, mussels, shrimp, wraps, cold salads, cheese and charcuterie boards, bread, cornbread, pates, assorted fritters.',
    'Plated service with 1 main dish.',
    'Main dishes: Cod with cream, cod with cornbread, cod a Bras, duck rice, beef stew, roasted loin, suckling pig, monkfish rice, mixed grill, vegetarian or vegan option.',
    'Dessert buffet: Cheesecake, almond tart, biscuit cake, pudding, chocolate cake, mini desserts, cheese board and quince, sliced fruit.',
    'Beverages included: Water, soft drinks, juices, white and red wine, beer, coffee, sparkling wine for cake, digestifs.'
  ],
  ARRAY['casamento','buffet','group:buffet-casamento'],
  2,
  true
FROM menu
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Buffet Casamento - Opcao B1' AND s.category_id = menu.id
)
UNION ALL
SELECT
  menu.id,
  'Buffet Casamento - Opcao B2',
  'Wedding Buffet - Option B2',
  'Servico a mesa com 2 pratos (opcao B2).',
  'Plated service with 2 main dishes (option B2).',
  'per_person',
  95.00,
  'pessoa',
  'person',
  ARRAY[
    'Entradas Buffet (Welcome Food): Rissois, croquetes, empadas, bolinhos de bacalhau, enchidos, rodoes, moelas, mexilhao, camarao, wraps, saladas frias, tabuas de queijos e enchidos, pao, broa, pates e fritos variados.',
    'Servico a mesa com 2 pratos (recomendado).',
    'Lista de pratos: Bacalhau com natas, bacalhau assado com broa, bacalhau a Bras, arroz de pato, vitela estufada, lombo assado, leitao, arroz de tamboril, grelhada mista, opcao vegetariana ou vegan.',
    'Sobremesas Buffet: Cheesecake, tarte de amendoa, bolo de bolacha, pudim, bolo de chocolate, mini sobremesas, tabua de queijo e marmelada, fruta laminada.',
    'Bebidas Incluidas: Agua, refrigerantes, sumos, vinho branco e tinto, cerveja, cafe, espumante para corte do bolo e digestivos.'
  ],
  ARRAY[
    'Welcome Food: Rissois, croquettes, empadas, codfish fritters, sausages, pork bites, mussels, shrimp, wraps, cold salads, cheese and charcuterie boards, bread, cornbread, pates, assorted fritters.',
    'Plated service with 2 main dishes (recommended).',
    'Main dishes: Cod with cream, cod with cornbread, cod a Bras, duck rice, beef stew, roasted loin, suckling pig, monkfish rice, mixed grill, vegetarian or vegan option.',
    'Dessert buffet: Cheesecake, almond tart, biscuit cake, pudding, chocolate cake, mini desserts, cheese board and quince, sliced fruit.',
    'Beverages included: Water, soft drinks, juices, white and red wine, beer, coffee, sparkling wine for cake, digestifs.'
  ],
  ARRAY['casamento','buffet','group:buffet-casamento','recommended'],
  3,
  true
FROM menu
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Buffet Casamento - Opcao B2' AND s.category_id = menu.id
)
UNION ALL
SELECT
  beverages.id,
  'Bebidas Incluidas',
  'Beverages Included',
  'Servico de bebidas incluido no menu.',
  'Beverage service included with the menu.',
  'on_request',
  NULL,
  NULL,
  NULL,
  ARRAY[
    'Agua, refrigerantes, sumos, vinho branco e tinto, cerveja, cafe, espumante para corte do bolo e digestivos.'
  ],
  ARRAY[
    'Water, soft drinks, juices, white and red wine, beer, coffee, sparkling wine for cake, digestifs.'
  ],
  ARRAY['bebidas'],
  1,
  true
FROM beverages
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Bebidas Incluidas' AND s.category_id = beverages.id
)
UNION ALL
SELECT
  bartender.id,
  'Servico de Bartender',
  'Bartender Service',
  'Servico de cocktails com bartender.',
  'Cocktail service with bartender.',
  'per_person',
  17.00,
  'pessoa',
  'person',
  ARRAY[
    'Inclui 1 hora durante o welcome drink e 2 horas apos o jantar.',
    'Cocktails: Gin tonico, caipirinha, mojito, whisky-cola, vodka com sumo de laranja, Aperol Spritz e Licor Beirao.'
  ],
  ARRAY[
    'Includes 1 hour during the welcome drink and 2 hours after dinner.',
    'Cocktails: Gin tonic, caipirinha, mojito, whisky-cola, vodka with orange juice, Aperol Spritz, Licor Beirao.'
  ],
  ARRAY['bartender','opcional'],
  1,
  true
FROM bartender
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Servico de Bartender' AND s.category_id = bartender.id
)
UNION ALL
SELECT
  extras.id,
  'Extras (Opcionais)',
  'Extras (Optional)',
  'Lista de extras disponiveis.',
  'List of optional extras.',
  'fixed',
  0.00,
  NULL,
  NULL,
  ARRAY[
    'Decoracao reforcada',
    'Staff extra',
    'DJ e sistema de som',
    'Guarda-sois',
    'Tenda',
    'Bebidas extra',
    'Horas extra de bartender',
    'Cadeiras adicionais'
  ],
  ARRAY[
    'Enhanced decoration',
    'Extra staff',
    'DJ and sound system',
    'Parasols',
    'Tent',
    'Extra beverages',
    'Extra bartender hours',
    'Additional chairs'
  ],
  ARRAY['extras'],
  1,
  true
FROM extras
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Extras (Opcionais)' AND s.category_id = extras.id
);

-- Incluir listas de itens (incluidos) como linhas textuais
INSERT INTO service_included_items (service_id, section_key, text_pt, text_en, sort_order)
SELECT
  s.id,
  'inclui',
  items.item_pt,
  items.item_en,
  items.ord::int
FROM services s
JOIN LATERAL unnest(s.included_items_pt, s.included_items_en) WITH ORDINALITY AS items(item_pt, item_en, ord)
  ON true
WHERE s.included_items_pt IS NOT NULL
  AND items.item_pt NOT ILIKE 'Extras:%'
  AND NOT EXISTS (
    SELECT 1
    FROM service_included_items i
    WHERE i.service_id = s.id
      AND i.text_pt = items.item_pt
  );
