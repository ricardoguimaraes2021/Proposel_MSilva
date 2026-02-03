-- Seed de servicos com base no website (brunch, coffee breaks, casamentos, empresas)
-- Idempotente: nao duplica servicos existentes

WITH
brunch_category AS (
  SELECT id FROM service_categories WHERE name_pt = 'Brunch' LIMIT 1
),
brunch_insert AS (
  INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order)
  SELECT 'Brunch', 'Brunch', 'Servicos de brunch.', 'Brunch services.', 1
  WHERE NOT EXISTS (SELECT 1 FROM brunch_category)
  RETURNING id
),
brunch AS (
  SELECT id FROM brunch_insert
  UNION ALL
  SELECT id FROM brunch_category
),
coffee_category AS (
  SELECT id FROM service_categories WHERE name_pt = 'Coffee Breaks' LIMIT 1
),
coffee_insert AS (
  INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order)
  SELECT 'Coffee Breaks', 'Coffee Breaks', 'Servicos de coffee break.', 'Coffee break services.', 2
  WHERE NOT EXISTS (SELECT 1 FROM coffee_category)
  RETURNING id
),
coffee AS (
  SELECT id FROM coffee_insert
  UNION ALL
  SELECT id FROM coffee_category
),
weddings_category AS (
  SELECT id FROM service_categories WHERE name_pt = 'Casamentos' LIMIT 1
),
weddings_insert AS (
  INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order)
  SELECT 'Casamentos', 'Weddings', 'Menus para casamentos.', 'Wedding menus.', 3
  WHERE NOT EXISTS (SELECT 1 FROM weddings_category)
  RETURNING id
),
weddings AS (
  SELECT id FROM weddings_insert
  UNION ALL
  SELECT id FROM weddings_category
),
companies_category AS (
  SELECT id FROM service_categories WHERE name_pt = 'Empresas' LIMIT 1
),
companies_insert AS (
  INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order)
  SELECT 'Empresas', 'Companies', 'Servicos para empresas.', 'Corporate services.', 4
  WHERE NOT EXISTS (SELECT 1 FROM companies_category)
  RETURNING id
),
companies AS (
  SELECT id FROM companies_insert
  UNION ALL
  SELECT id FROM companies_category
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
  included_items_pt,
  included_items_en,
  tags,
  sort_order,
  is_active
)
SELECT
  brunch.id,
  'Brunch - Sabores Tradicionais (Classico Buffet)',
  'Brunch - Traditional Flavors (Classic Buffet)',
  'Combinacao de pratos tradicionais, salgados e sobremesas com toque de mar.',
  'Combination of traditional bites, savory items, desserts, and a touch of the sea.',
  'per_person',
  27.00,
  'pessoa',
  'person',
  15,
  ARRAY[
    'Entradas/Salgados: Rissois de carne, rissois de camarao, croquetes de vitela, empadas de frango, bolinhos de bacalhau, caprichos do mar, folhados de salsicha, folhados de alheira, enchidos assados, moelas, rodoes, pataniscas de bacalhau, mexilhao com molho verde, bola mista e bacon, bola de frango, quiche de legumes, panados, salada fria de grao-de-bico e bacalhau, salada de feijao-frade e atum, pate com tostas, broa de milho, azeitonas, tabua de queijos e enchidos.',
    'Sobremesas e frutas: Tarte de frutas, tarte de amendoa, pudim, bolo brigadeirao, fruta laminada ou espetadas.',
    'Bebidas: Dispensadores com agua aromatizada e sumo de laranja.',
    'Extras: Camarao, salada de polvo e sapateira recheada +5 EUR por pessoa.',
    'Criancas: Ate 2 anos gratis; 3 a 8 anos 50% desconto.'
  ],
  ARRAY[
    'Starters: meat and shrimp rissois, veal croquettes, chicken empadas, codfish fritters, seafood bites, sausage and alheira pastries, roasted sausages, gizzards, pork bites, codfish fritters, mussels with green sauce, mixed meat and bacon bread, chicken bread, vegetable quiche, breaded items, chickpea and cod salad, black-eyed pea and tuna salad, pate with toast, cornbread, olives, cheese and charcuterie board.',
    'Desserts and fruit: fruit tart, almond tart, pudding, brigadeiro cake, sliced fruit or skewers.',
    'Beverages: dispensers with flavored water and orange juice.',
    'Extras: shrimp, octopus salad and stuffed crab +5 EUR per person.',
    'Kids: up to 2 years free; 3 to 8 years 50% discount.'
  ],
  ARRAY['brunch','group:brunch'],
  1,
  true
FROM brunch
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Brunch - Sabores Tradicionais (Classico Buffet)' AND s.category_id = brunch.id
)
UNION ALL
SELECT
  brunch.id,
  'Brunch - Momentos Deliciosos (Buffet Especial)',
  'Brunch - Delicious Moments (Special Buffet)',
  'Selecao de folhados, wraps, croissants e petiscos leves.',
  'Selection of pastries, wraps, croissants and light bites.',
  'per_person',
  22.50,
  'pessoa',
  'person',
  10,
  ARRAY[
    'Entradas/Salgados: Folhados de alheira, folhados de salsicha, empadas de frango, mini croissants de queijo e fiambre, broa recheada com tostas, batata frita, tiras de pota panadas com molho agridoce, wraps de atum e delicias do mar, rissois de carne, bolinhas de alheira, croquetes de vitela, bolinhos de bacalhau, bola mista com bacon.',
    'Sobremesas e frutas: Tarte de frutas, profiteroles, fruta laminada ou espetadas.',
    'Bebidas: Dispensadores com agua aromatizada e sumo de laranja.',
    'Extras: Camarao, salada de polvo e sapateira recheada +5 EUR por pessoa.',
    'Criancas: Ate 2 anos gratis; 3 a 8 anos 50% desconto.'
  ],
  ARRAY[
    'Starters: alheira pastries, sausage pastries, chicken empadas, mini cheese and ham croissants, cornbread with toast, fries, breaded squid strips with sweet-sour sauce, tuna wraps and seafood delights, meat rissois, alheira balls, veal croquettes, codfish fritters, mixed bread with bacon.',
    'Desserts and fruit: fruit tart, profiteroles, sliced fruit or skewers.',
    'Beverages: dispensers with flavored water and orange juice.',
    'Extras: shrimp, octopus salad and stuffed crab +5 EUR per person.',
    'Kids: up to 2 years free; 3 to 8 years 50% discount.'
  ],
  ARRAY['brunch','group:brunch'],
  2,
  true
FROM brunch
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Brunch - Momentos Deliciosos (Buffet Especial)' AND s.category_id = brunch.id
)
UNION ALL
SELECT
  brunch.id,
  'Brunch - Pequenos Gourmets (Festa dos Sabores)',
  'Brunch - Little Gourmets (Kids Buffet)',
  'Menu divertido para criancas com mini cachorros e doces.',
  'Fun menu for kids with mini hot dogs and sweets.',
  'per_person',
  25.00,
  'pessoa',
  'person',
  10,
  ARRAY[
    'Entradas/Salgados: Mini croissants mistos, mini cachorros com molhos, rissois de carne, croquetes, bolinhos de bacalhau, mini sandes ou mini hamburguer, mini wraps, batatas fritas, bola mista.',
    'Doces: Espetadas de fruta, gomas, pipocas, panquecas com Nutella e mel, gelatinas no copo, mousse de Oreo ou chocolate no copo, bolo brigadeirao.',
    'Bebidas: Dispensadores com agua e sumo de laranja.'
  ],
  ARRAY[
    'Starters: mini mixed croissants, mini hot dogs with sauces, meat rissois, croquettes, codfish fritters, mini sandwiches or mini burgers, mini wraps, fries, mixed bread.',
    'Sweets: fruit skewers, gummies, popcorn, Nutella and honey pancakes, gelatin cups, Oreo or chocolate mousse cups, brigadeiro cake.',
    'Beverages: dispensers with water and orange juice.'
  ],
  ARRAY['brunch','group:brunch'],
  3,
  true
FROM brunch
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Brunch - Pequenos Gourmets (Festa dos Sabores)' AND s.category_id = brunch.id
)
UNION ALL
SELECT
  brunch.id,
  'Brunch - Brunch do Campo',
  'Brunch - Countryside Brunch',
  'Pratos rusticos com wraps de salmao e doces tradicionais.',
  'Rustic bites with smoked salmon wraps and classic desserts.',
  'per_person',
  25.00,
  'pessoa',
  'person',
  NULL,
  ARRAY[
    'Entradas/Salgados: Salgadinhos fritos (rissois, bolinhos, croquetes, chamucas), tabua de queijos e enchidos, melao com presunto, empadas de frango, batata frita, bola mista, folhados de requeijao com nozes e abobora, mini quiches de legumes, vol-au-vent de atum, rolinhos de wrap de salmao fumado, asinhas com molho agridoce, espetadas de tomate e mozarela, humus com palitos de legumes, pate com tostas, mini croissants mistos ou mini sandes mistas.',
    'Doces: Espetadas de fruta, sortido (mini bolas de Berlim e natas), brownie de chocolate, bolo de laranja.',
    'Bebidas: Dispensadores com agua aromatizada, sumo de laranja, cafe.'
  ],
  ARRAY[
    'Starters: fried snacks (rissois, fritters, croquettes, samosas), cheese and charcuterie board, melon with ham, chicken empadas, fries, mixed bread, ricotta pastries with nuts and pumpkin, mini vegetable quiches, tuna vol-au-vent, smoked salmon wrap rolls, wings with sweet-sour sauce, tomato and mozzarella skewers, hummus with veggie sticks, pate with toast, mini mixed croissants or mini sandwiches.',
    'Desserts: fruit skewers, assorted mini Berlin balls and cream, chocolate brownie, orange cake.',
    'Beverages: dispensers with flavored water, orange juice, coffee.'
  ],
  ARRAY['brunch','group:brunch'],
  4,
  true
FROM brunch
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Brunch - Brunch do Campo' AND s.category_id = brunch.id
)
UNION ALL
SELECT
  brunch.id,
  'Brunch - Brunch Gourmet',
  'Brunch - Gourmet Brunch',
  'Oferta requintada com camarao panado, bagels e cheesecake.',
  'Refined offer with breaded shrimp, bagels and cheesecake.',
  'per_person',
  27.50,
  'pessoa',
  'person',
  NULL,
  ARRAY[
    'Entradas/Salgados: Salgadinhos fritos (rissois, bolinhos, croquetes, chamucas), camarao panado com molho agridoce, mini hamburguer, pao recheado com tostas, batata frita, moelinhas ou tabua de queijos e enchidos, bacalhau com natas ou arroz de pato (aperitivo), rolinhos de wrap de atum, salada de queijo feta, tomate cherry e rucula, humus com dip de legumes, camembert folhado com frutos secos, bagels de salmao fumado e queijo creme.',
    'Doces: Espetadas de fruta, sortido (mini bolas de Berlim e natas), bolo de chocolate e brigadeiro, cheesecake de frutos vermelhos.',
    'Bebidas: Dispensadores com agua aromatizada, sumo de laranja, cafe.'
  ],
  ARRAY[
    'Starters: fried snacks (rissois, fritters, croquettes, samosas), breaded shrimp with sweet-sour sauce, mini burgers, bread with toast, fries, gizzards or cheese and charcuterie board, cod with cream or duck rice appetizer, tuna wrap rolls, feta salad with cherry tomato and arugula, hummus with veggie dip, baked camembert with nuts, smoked salmon bagels with cream cheese.',
    'Desserts: fruit skewers, assorted mini Berlin balls and cream, chocolate and brigadeiro cake, red berry cheesecake.',
    'Beverages: dispensers with flavored water, orange juice, coffee.'
  ],
  ARRAY['brunch','group:brunch'],
  5,
  true
FROM brunch
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Brunch - Brunch Gourmet' AND s.category_id = brunch.id
)
UNION ALL
SELECT
  coffee.id,
  'Coffee Break Simples',
  'Simple Coffee Break',
  'Agua, cafe, cha, bolos, bolachas e croissants.',
  'Water, coffee, tea, cakes, biscuits, and croissants.',
  'per_person',
  8.00,
  'pessoa',
  'person',
  10,
  ARRAY[
    'Agua, cafe e cha',
    'Bolos variados (chocolate, cenoura, laranja)',
    'Bolachas sortidas',
    'Croissants mistos'
  ],
  ARRAY[
    'Water, coffee and tea',
    'Assorted cakes (chocolate, carrot, orange)',
    'Assorted biscuits',
    'Mixed croissants'
  ],
  ARRAY['coffee-break','group:coffee-break'],
  1,
  true
FROM coffee
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Coffee Break Simples' AND s.category_id = coffee.id
)
UNION ALL
SELECT
  coffee.id,
  'Coffee Break Completo',
  'Complete Coffee Break',
  'Agua, cafe, cha, sumos, bolos, mini croissants, salgados e fruta.',
  'Water, coffee, tea, juices, cakes, mini croissants, savory bites and fruit.',
  'per_person',
  12.00,
  'pessoa',
  'person',
  10,
  ARRAY[
    'Agua, cafe, cha e sumos',
    'Bolos variados',
    'Mini croissants e folhados',
    'Salgadinhos variados',
    'Fruta fresca'
  ],
  ARRAY[
    'Water, coffee, tea and juices',
    'Assorted cakes',
    'Mini croissants and pastries',
    'Assorted savory bites',
    'Fresh fruit'
  ],
  ARRAY['coffee-break','group:coffee-break'],
  2,
  true
FROM coffee
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Coffee Break Completo' AND s.category_id = coffee.id
)
UNION ALL
SELECT
  weddings.id,
  'Menu Classico',
  'Classic Menu',
  'Menu tradicional com entradas frias e quentes, prato principal a escolha e sobremesas variadas. Preco sob consulta.',
  'Traditional menu with cold and hot starters, main dish choice and varied desserts. Price on request.',
  'per_person',
  0.00,
  'pessoa',
  'person',
  NULL,
  ARRAY[
    'Entradas frias e quentes',
    'Prato principal a escolha',
    'Sobremesas variadas',
    'Preco sob consulta'
  ],
  ARRAY[
    'Cold and hot starters',
    'Main dish choice',
    'Varied desserts',
    'Price on request'
  ],
  ARRAY['casamento','sob_consulta','group:casamentos'],
  1,
  true
FROM weddings
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Menu Classico' AND s.category_id = weddings.id
)
UNION ALL
SELECT
  weddings.id,
  'Menu Premium',
  'Premium Menu',
  'Menu sofisticado com selecao gourmet de entradas, pratos principais premium e mesa de doces completa. Preco sob consulta.',
  'Sophisticated menu with gourmet starters, premium main dishes, and a full dessert table. Price on request.',
  'per_person',
  0.00,
  'pessoa',
  'person',
  NULL,
  ARRAY[
    'Selecao gourmet de entradas',
    'Pratos principais premium',
    'Mesa de doces completa',
    'Preco sob consulta'
  ],
  ARRAY[
    'Gourmet starter selection',
    'Premium main dishes',
    'Full dessert table',
    'Price on request'
  ],
  ARRAY['casamento','sob_consulta','group:casamentos'],
  2,
  true
FROM weddings
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Menu Premium' AND s.category_id = weddings.id
)
UNION ALL
SELECT
  companies.id,
  'Almoco Executivo',
  'Executive Lunch',
  'Entrada, prato principal, sobremesa e bebidas incluidas.',
  'Starter, main course, dessert and beverages included.',
  'per_person',
  18.00,
  'pessoa',
  'person',
  20,
  ARRAY[
    'Entrada',
    'Prato principal',
    'Sobremesa',
    'Bebidas incluidas'
  ],
  ARRAY[
    'Starter',
    'Main course',
    'Dessert',
    'Beverages included'
  ],
  ARRAY['empresa','group:empresas'],
  1,
  true
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Almoco Executivo' AND s.category_id = companies.id
)
UNION ALL
SELECT
  companies.id,
  'Cocktail Empresarial',
  'Corporate Cocktail',
  'Salgados variados, mesa de queijos e enchidos, bebidas incluidas.',
  'Assorted savory bites, cheese and charcuterie table, beverages included.',
  'per_person',
  15.00,
  'pessoa',
  'person',
  15,
  ARRAY[
    'Salgados variados',
    'Mesa de queijos e enchidos',
    'Bebidas (agua, sumos, vinho)'
  ],
  ARRAY[
    'Assorted savory bites',
    'Cheese and charcuterie table',
    'Beverages (water, juices, wine)'
  ],
  ARRAY['empresa','group:empresas'],
  2,
  true
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.name_pt = 'Cocktail Empresarial' AND s.category_id = companies.id
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

-- Opcoes pagas (ex: Extra Marisco) para brunch
INSERT INTO service_priced_options (
  service_id,
  name_pt,
  name_en,
  description_pt,
  description_en,
  pricing_type,
  price,
  min_quantity,
  sort_order
)
SELECT
  s.id,
  'Extra Marisco (Camarão/Polvo/Sapateira)',
  'Seafood Add-on (Shrimp/Octopus/Crab)',
  'Acresce 5€ por pessoa.',
  'Adds €5 per person.',
  'per_person',
  5.00,
  NULL,
  100
FROM services s
WHERE s.name_pt ILIKE 'Brunch - %'
  AND NOT EXISTS (
    SELECT 1
    FROM service_priced_options o
    WHERE o.service_id = s.id
      AND o.name_pt = 'Extra Marisco (Camarão/Polvo/Sapateira)'
  );
