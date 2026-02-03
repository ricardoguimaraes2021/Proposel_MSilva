BEGIN;

-- =========================================================
-- 1) Catalogo de itens + Momentos (blueprints)
-- =========================================================

CREATE TABLE IF NOT EXISTS catalog_items (
  id             bigserial PRIMARY KEY,
  name_pt        text NOT NULL,
  name_en        text NOT NULL,
  description_pt text,
  description_en text,
  pricing_type   text NOT NULL DEFAULT 'included',  -- included | per_person | fixed | on_request
  base_price     numeric(10,2),
  unit_pt        text,
  unit_en        text,
  min_quantity   integer,
  tags           text[] NOT NULL DEFAULT ARRAY[]::text[],
  sort_order     integer NOT NULL DEFAULT 1,
  is_active      boolean NOT NULL DEFAULT true,
  UNIQUE(name_pt)
);

CREATE TABLE IF NOT EXISTS proposal_moments (
  id         bigserial PRIMARY KEY,
  key        text NOT NULL UNIQUE,
  title_pt   text NOT NULL,
  title_en   text NOT NULL,
  sort_order integer NOT NULL DEFAULT 1,
  is_active  boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS moment_items (
  id         bigserial PRIMARY KEY,
  moment_id  bigint NOT NULL REFERENCES proposal_moments(id) ON DELETE CASCADE,
  item_id    bigint NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 1,
  UNIQUE(moment_id, item_id)
);

-- Linhas da proposta (snapshot por proposta)
CREATE TABLE IF NOT EXISTS proposal_lines (
  id           bigserial PRIMARY KEY,
  proposal_id  uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  moment_id    bigint REFERENCES proposal_moments(id) ON DELETE SET NULL,
  item_id      bigint REFERENCES catalog_items(id) ON DELETE SET NULL,
  title_pt     text,
  pricing_type text NOT NULL DEFAULT 'fixed',
  quantity     numeric(10,2) NOT NULL DEFAULT 1,
  unit_price   numeric(10,2),
  notes        text,
  sort_order   integer NOT NULL DEFAULT 1,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moment_items_moment ON moment_items(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_items_item ON moment_items(item_id);
CREATE INDEX IF NOT EXISTS idx_proposal_lines_proposal ON proposal_lines(proposal_id);

-- =========================================================
-- 2) Seeds: Momentos base
-- =========================================================

INSERT INTO proposal_moments (key, title_pt, title_en, sort_order, is_active)
SELECT x.key, x.pt, x.en, x.ord, true
FROM (VALUES
  ('casa_noivos',   'Casa dos Noivos',        'Bride/Groom House', 1),
  ('porta_igreja',  'Porta da Igreja',       'Church Entrance',   2),
  ('rececao',       'Rececao / Welcome',     'Reception / Welcome', 3),
  ('coffee_break',  'Coffee Break',          'Coffee Break',      4),
  ('brunch',        'Brunch',                'Brunch',            5),
  ('refeicao',      'Refeicao / Almoco',     'Meal / Lunch',      6),
  ('bebidas',       'Bebidas',               'Beverages',         7),
  ('staff_extras',  'Staff & Extras',        'Staff & Extras',    8),
  ('logistica',     'Logistica',             'Logistics',         9)
) AS x(key, pt, en, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM proposal_moments m WHERE m.key = x.key
);

-- =========================================================
-- 3) Seeds: Catalogo de itens (mock)
-- =========================================================

INSERT INTO catalog_items (name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, tags, sort_order)
SELECT * FROM (VALUES
  ('Rissois (sortido)', 'Rissois (assorted)', 'Salgado frito.', 'Fried savory bite.', 'per_person', 1.50, 'pessoa', 'person', ARRAY['comida','salgados'], 1),
  ('Croquetes (sortido)', 'Croquettes (assorted)', 'Salgado frito.', 'Fried savory bite.', 'per_person', 1.50, 'pessoa', 'person', ARRAY['comida','salgados'], 2),
  ('Bolinhos de bacalhau', 'Codfish fritters', 'Salgado frito.', 'Fried savory bite.', 'per_person', 1.80, 'pessoa', 'person', ARRAY['comida','salgados'], 3),
  ('Chamuças', 'Samosas', 'Salgado frito.', 'Fried savory bite.', 'per_person', 1.50, 'pessoa', 'person', ARRAY['comida','salgados'], 4),
  ('Empadas de frango', 'Chicken empadas', 'Salgado assado.', 'Baked savory.', 'per_person', 1.80, 'pessoa', 'person', ARRAY['comida','salgados'], 5),
  ('Mini quiche de legumes', 'Mini vegetable quiche', 'Quiche individual.', 'Individual quiche.', 'per_person', 2.20, 'pessoa', 'person', ARRAY['comida','salgados'], 6),
  ('Tabua de queijos e enchidos', 'Cheese & charcuterie board', 'Selecao para partilha.', 'Sharing board.', 'fixed', 65.00, 'tabua', 'board', ARRAY['comida','tabuas'], 7),
  ('Melao com presunto', 'Melon with ham', 'Entrada fria.', 'Cold starter.', 'per_person', 2.50, 'pessoa', 'person', ARRAY['comida','entradas'], 8),
  ('Humus com palitos de legumes', 'Hummus with veggie sticks', 'Entrada leve.', 'Light starter.', 'fixed', 35.00, 'travessa', 'platter', ARRAY['comida','entradas'], 9),
  ('Pate com tostas', 'Pate with toast', 'Entrada fria.', 'Cold starter.', 'fixed', 30.00, 'travessa', 'platter', ARRAY['comida','entradas'], 10)
) AS v(name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM catalog_items i WHERE i.name_pt = v.name_pt);

INSERT INTO catalog_items (name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, tags, sort_order)
SELECT * FROM (VALUES
  ('Bolo de laranja (fatia)', 'Orange cake (slice)', 'Sobremesa.', 'Dessert.', 'per_person', 1.80, 'pessoa', 'person', ARRAY['doces'], 20),
  ('Brownie de chocolate (fatia)', 'Chocolate brownie (slice)', 'Sobremesa.', 'Dessert.', 'per_person', 2.20, 'pessoa', 'person', ARRAY['doces'], 21),
  ('Espetadas de fruta', 'Fruit skewers', 'Fruta preparada.', 'Prepared fruit.', 'per_person', 2.00, 'pessoa', 'person', ARRAY['doces','fruta'], 22),
  ('Sortido mini (Berlim + natas)', 'Mini assorted (Berlin + cream)', 'Sortido mini.', 'Mini assorted.', 'per_person', 2.50, 'pessoa', 'person', ARRAY['doces'], 23)
) AS v(name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM catalog_items i WHERE i.name_pt = v.name_pt);

INSERT INTO catalog_items (name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, tags, sort_order)
SELECT * FROM (VALUES
  ('Dispensador: agua aromatizada', 'Dispenser: flavored water', 'Inclui copos/dispensador.', 'Includes dispenser/cups.', 'fixed', 25.00, 'un', 'unit', ARRAY['bebidas'], 40),
  ('Dispensador: sumo de laranja', 'Dispenser: orange juice', 'Inclui copos/dispensador.', 'Includes dispenser/cups.', 'fixed', 30.00, 'un', 'unit', ARRAY['bebidas'], 41),
  ('Agua com gas', 'Sparkling water', 'Bebida.', 'Drink.', 'per_person', 0.60, 'pessoa', 'person', ARRAY['bebidas'], 42),
  ('Refrigerantes', 'Soft drinks', 'Bebida.', 'Drink.', 'per_person', 0.90, 'pessoa', 'person', ARRAY['bebidas'], 43),
  ('Vinho verde branco', 'Vinho verde (white)', 'Bebida.', 'Drink.', 'per_person', 2.20, 'pessoa', 'person', ARRAY['bebidas','vinho'], 44),
  ('Vinho maduro tinto', 'Red wine', 'Bebida.', 'Drink.', 'per_person', 2.50, 'pessoa', 'person', ARRAY['bebidas','vinho'], 45),
  ('Cerveja (mini)', 'Beer (mini)', 'Bebida.', 'Drink.', 'per_person', 1.20, 'pessoa', 'person', ARRAY['bebidas','cerveja'], 46),
  ('Cafe', 'Coffee', 'Servico de cafe.', 'Coffee service.', 'fixed', 20.00, 'servico', 'service', ARRAY['bebidas','cafe'], 47),
  ('Digestivos (opcional)', 'Digestifs (optional)', 'Sob consulta.', 'On request.', 'on_request', NULL, 'servico', 'service', ARRAY['bebidas','sob_consulta'], 48)
) AS v(name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM catalog_items i WHERE i.name_pt = v.name_pt);

INSERT INTO catalog_items (name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, min_quantity, tags, sort_order)
SELECT * FROM (VALUES
  ('Bartender (cocktails)', 'Bartender (cocktails)', 'Referencia mock: 1100EUR / 100 pax.', 'Mock reference: 1100EUR / 100 pax.', 'fixed', 1100.00, 'evento', 'event', 100, ARRAY['staff'], 60),
  ('Corte de presunto', 'Ham carving', 'Referencia mock: 600EUR / 100 pax.', 'Mock reference: 600EUR / 100 pax.', 'fixed', 600.00, 'evento', 'event', 100, ARRAY['staff'], 61),
  ('Corte do bolo + espumante/porto', 'Cake cutting + sparkling/port', 'Sob consulta (pode preencher).', 'On request (fill later).', 'on_request', NULL, 'evento', 'event', 100, ARRAY['extra','sob_consulta'], 62),
  ('Extra Marisco (+5EUR/pax)', 'Seafood add-on (+EUR5/pp)', 'Camarao/polvo/sapateira.', 'Shrimp/octopus/crab.', 'per_person', 5.00, 'pessoa', 'person', NULL, ARRAY['extra','marisco'], 63),
  ('Horas extra (50EUR/hora)', 'Extra hours (EUR50/hour)', 'Aplicavel quando necessario.', 'Applied when needed.', 'fixed', 50.00, 'hora', 'hour', NULL, ARRAY['logistica'], 64)
) AS v(name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, min_quantity, tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM catalog_items i WHERE i.name_pt = v.name_pt);

-- =========================================================
-- 4) Sugestoes por momento
-- =========================================================

WITH m AS (
  SELECT key, id FROM proposal_moments
),
i AS (
  SELECT name_pt, id FROM catalog_items
)
INSERT INTO moment_items (moment_id, item_id, is_default, sort_order)
SELECT m.id, i.id, false, x.ord
FROM m
JOIN (VALUES
  ('casa_noivos','Rissois (sortido)',1),
  ('casa_noivos','Croquetes (sortido)',2),
  ('casa_noivos','Bolinhos de bacalhau',3),
  ('casa_noivos','Empadas de frango',4),
  ('casa_noivos','Tabua de queijos e enchidos',5),
  ('casa_noivos','Dispensador: agua aromatizada',6),
  ('casa_noivos','Dispensador: sumo de laranja',7),
  ('casa_noivos','Cafe',8)
) AS x(mkey, iname, ord) ON x.mkey = m.key
JOIN i ON i.name_pt = x.iname
WHERE NOT EXISTS (
  SELECT 1 FROM moment_items mi WHERE mi.moment_id = m.id AND mi.item_id = i.id
);

WITH m AS (
  SELECT key, id FROM proposal_moments
),
i AS (
  SELECT name_pt, id FROM catalog_items
)
INSERT INTO moment_items (moment_id, item_id, is_default, sort_order)
SELECT m.id, i.id, false, x.ord
FROM m
JOIN (VALUES
  ('porta_igreja','Espetadas de fruta',1),
  ('porta_igreja','Sortido mini (Berlim + natas)',2),
  ('porta_igreja','Dispensador: agua aromatizada',3),
  ('porta_igreja','Dispensador: sumo de laranja',4),
  ('porta_igreja','Refrigerantes',5)
) AS x(mkey, iname, ord) ON x.mkey = m.key
JOIN i ON i.name_pt = x.iname
WHERE NOT EXISTS (
  SELECT 1 FROM moment_items mi WHERE mi.moment_id = m.id AND mi.item_id = i.id
);

WITH m AS (
  SELECT key, id FROM proposal_moments
),
i AS (
  SELECT name_pt, id FROM catalog_items
)
INSERT INTO moment_items (moment_id, item_id, is_default, sort_order)
SELECT m.id, i.id, false, x.ord
FROM m
JOIN (VALUES
  ('rececao','Melao com presunto',1),
  ('rececao','Tabua de queijos e enchidos',2),
  ('rececao','Vinho verde branco',3),
  ('rececao','Vinho maduro tinto',4),
  ('rececao','Cerveja (mini)',5)
) AS x(mkey, iname, ord) ON x.mkey = m.key
JOIN i ON i.name_pt = x.iname
WHERE NOT EXISTS (
  SELECT 1 FROM moment_items mi WHERE mi.moment_id = m.id AND mi.item_id = i.id
);

WITH m AS (
  SELECT key, id FROM proposal_moments
),
i AS (
  SELECT name_pt, id FROM catalog_items
)
INSERT INTO moment_items (moment_id, item_id, is_default, sort_order)
SELECT m.id, i.id, false, x.ord
FROM m
JOIN (VALUES
  ('staff_extras','Bartender (cocktails)',1),
  ('staff_extras','Corte de presunto',2),
  ('staff_extras','Corte do bolo + espumante/porto',3),
  ('staff_extras','Extra Marisco (+5EUR/pax)',4),
  ('staff_extras','Horas extra (50EUR/hora)',5)
) AS x(mkey, iname, ord) ON x.mkey = m.key
JOIN i ON i.name_pt = x.iname
WHERE NOT EXISTS (
  SELECT 1 FROM moment_items mi WHERE mi.moment_id = m.id AND mi.item_id = i.id
);

-- =========================================================
-- 5) RLS
-- =========================================================

ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage catalog_items"
  ON catalog_items FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage proposal_moments"
  ON proposal_moments FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage moment_items"
  ON moment_items FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage proposal_lines"
  ON proposal_lines FOR ALL
  USING (auth.role() = 'authenticated');

COMMIT;
