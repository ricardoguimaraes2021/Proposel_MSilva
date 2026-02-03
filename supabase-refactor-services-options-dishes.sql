-- =============================================================================
-- REFACTOR: Opções por serviço + Pratos à escolha + dados alinhados ao v0
-- Executar no SQL Editor do Supabase (após ter o schema base já aplicado).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. NOVAS TABELAS
-- -----------------------------------------------------------------------------

-- Opções dentro de um serviço (ex.: Refeição → Opção A Buffet, Opção B1, Opção B2)
-- Permite "várias opções na mesma proposta" e o cliente escolhe uma.
CREATE TABLE IF NOT EXISTS service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'per_person' CHECK (pricing_type IN ('per_person', 'fixed', 'on_request')),
  price_per_person DECIMAL(10,2),
  recommended BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE service_options IS 'Opções selecionáveis dentro de um serviço (ex.: Opção A Buffet 75€, Opção B2 95€ recomendado)';

-- Pratos à escolha (Lista de Pratos) associada a um serviço ou a uma opção
-- Ex.: quando o cliente escolhe o serviço Refeição, vê esta lista de pratos disponíveis.
CREATE TABLE IF NOT EXISTS service_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  service_option_id UUID REFERENCES service_options(id) ON DELETE CASCADE,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE service_dishes IS 'Pratos/itens disponíveis para escolha (ex.: Lista de Pratos à Escolha da Refeição). service_option_id NULL = lista do serviço inteiro; preenchido = lista específica dessa opção.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_options_service ON service_options(service_id);
CREATE INDEX IF NOT EXISTS idx_service_dishes_service ON service_dishes(service_id);
CREATE INDEX IF NOT EXISTS idx_service_dishes_option ON service_dishes(service_option_id);

-- -----------------------------------------------------------------------------
-- 2. ALTERAÇÕES À PROPOSTA (guardar qual opção foi escolhida)
-- -----------------------------------------------------------------------------

ALTER TABLE proposal_services
  ADD COLUMN IF NOT EXISTS service_option_id UUID REFERENCES service_options(id) ON DELETE SET NULL;

ALTER TABLE proposal_services
  ADD COLUMN IF NOT EXISTS service_option_name_pt TEXT;

ALTER TABLE proposal_services
  ADD COLUMN IF NOT EXISTS service_option_name_en TEXT;

COMMENT ON COLUMN proposal_services.service_option_id IS 'Opção escolhida (ex.: Opção B2) quando o serviço tem várias opções';

-- -----------------------------------------------------------------------------
-- 3. RLS (Row Level Security)
-- -----------------------------------------------------------------------------

ALTER TABLE service_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_dishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage service_options" ON service_options;
CREATE POLICY "Authenticated users can manage service_options"
  ON service_options FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage service_dishes" ON service_dishes;
CREATE POLICY "Authenticated users can manage service_dishes"
  ON service_dishes FOR ALL
  USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- 4. SEED: Categorias (se não existirem)
-- -----------------------------------------------------------------------------

INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order, is_active)
SELECT 'Refeição', 'Meal', 'Opções de serviço de refeição', 'Meal service options', 1, true
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name_pt = 'Refeição' LIMIT 1);

INSERT INTO service_categories (name_pt, name_en, sort_order, is_active)
SELECT 'Sobremesas e Bebidas', 'Desserts & Drinks', 2, true
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name_pt = 'Sobremesas e Bebidas' LIMIT 1);

INSERT INTO service_categories (name_pt, name_en, description_pt, description_en, sort_order, is_active)
SELECT 'Extras', 'Extras', 'Serviços adicionais sob consulta', 'Additional services upon request', 3, true
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name_pt = 'Extras' LIMIT 1);

-- -----------------------------------------------------------------------------
-- 5. SEED: Serviço Refeição + Opções (Opção A, B1, B2) + Pratos à escolha
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  cat_ref_id UUID;
  svc_ref_id UUID;
BEGIN
  SELECT id INTO cat_ref_id FROM service_categories WHERE name_pt = 'Refeição' ORDER BY sort_order LIMIT 1;
  IF cat_ref_id IS NULL THEN
    INSERT INTO service_categories (name_pt, name_en, sort_order, is_active)
    VALUES ('Refeição', 'Meal', 1, true)
    RETURNING id INTO cat_ref_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE name_pt = 'Opções de Refeição' LIMIT 1) THEN
    INSERT INTO services (category_id, name_pt, name_en, pricing_type, base_price, unit_pt, unit_en, sort_order, is_active)
    VALUES (cat_ref_id, 'Opções de Refeição', 'Meal Options', 'per_person', NULL, 'pessoa', 'person', 1, true)
    RETURNING id INTO svc_ref_id;

    INSERT INTO service_options (service_id, name_pt, name_en, description_pt, description_en, pricing_type, price_per_person, recommended, sort_order)
    VALUES (svc_ref_id, 'Opção A — Buffet', 'Option A — Buffet', 'Serviço de refeição quente em buffet, com escolha de 2 pratos da lista apresentada.', 'Hot buffet meal service, with choice of 2 dishes from the list.', 'per_person', 75, false, 1);
    INSERT INTO service_options (service_id, name_pt, name_en, description_pt, description_en, pricing_type, price_per_person, recommended, sort_order)
    VALUES (svc_ref_id, 'Opção B1 — Serviço à mesa com 1 prato', 'Option B1 — Table service with 1 dish', 'Serviço empratado aos convidados. Escolha de peixe ou carne.', 'Plated service for guests. Choice of fish or meat.', 'per_person', 85, false, 2);
    INSERT INTO service_options (service_id, name_pt, name_en, description_pt, description_en, pricing_type, price_per_person, recommended, sort_order)
    VALUES (svc_ref_id, 'Opção B2 — Serviço à mesa com 2 pratos', 'Option B2 — Table service with 2 dishes', 'Serviço empratado: 1 prato de peixe e 1 prato de carne. A opção que melhor valoriza o momento à mesa e a experiência dos convidados.', 'Plated service: 1 fish and 1 meat dish. The option that best values the moment at the table and the guests'' experience.', 'per_person', 95, true, 3);

    INSERT INTO service_dishes (service_id, name_pt, name_en, sort_order)
    VALUES
      (svc_ref_id, 'Bacalhau com natas', 'Cod with cream', 1),
      (svc_ref_id, 'Bacalhau assado com broa', 'Roasted cod with cornbread', 2),
      (svc_ref_id, 'Bacalhau à Brás', 'Cod à Brás', 3),
      (svc_ref_id, 'Arroz de pato', 'Duck rice', 4),
      (svc_ref_id, 'Arroz de tamboril', 'Monkfish rice', 5),
      (svc_ref_id, 'Vitela estufada', 'Stewed veal', 6),
      (svc_ref_id, 'Leitão', 'Suckling pig', 7),
      (svc_ref_id, 'Lombo assado', 'Roasted loin', 8),
      (svc_ref_id, 'Grelhada mista', 'Mixed grill', 9),
      (svc_ref_id, 'Opção vegetariana ou vegan', 'Vegetarian or vegan option', 10);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6. SEED: Sobremesas (Buffet) – serviço com itens incluídos
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  cat_id UUID;
  svc_id UUID;
BEGIN
  SELECT id INTO cat_id FROM service_categories WHERE name_pt = 'Sobremesas e Bebidas' ORDER BY sort_order LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM services WHERE name_pt = 'Sobremesas (Buffet)' LIMIT 1) THEN
    INSERT INTO services (category_id, name_pt, name_en, pricing_type, base_price, unit_pt, unit_en, sort_order, is_active)
    VALUES (cat_id, 'Sobremesas (Buffet)', 'Desserts (Buffet)', 'fixed', 0, 'serviço', 'service', 10, true)
    RETURNING id INTO svc_id;

    INSERT INTO service_included_items (service_id, section_key, text_pt, text_en, sort_order)
    VALUES
      (svc_id, 'default', 'Cheesecake', 'Cheesecake', 1),
      (svc_id, 'default', 'Tarte de amêndoa', 'Almond tart', 2),
      (svc_id, 'default', 'Bolo de bolacha', 'Biscuit cake', 3),
      (svc_id, 'default', 'Pudim', 'Pudding', 4),
      (svc_id, 'default', 'Bolo de chocolate', 'Chocolate cake', 5),
      (svc_id, 'default', 'Mini sobremesas', 'Mini desserts', 6),
      (svc_id, 'default', 'Tábua de queijo e marmelada', 'Cheese and marmalade board', 7),
      (svc_id, 'default', 'Fruta laminada', 'Sliced fruit', 8);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. SEED: Bebidas Incluídas
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  cat_id UUID;
  svc_id UUID;
BEGIN
  SELECT id INTO cat_id FROM service_categories WHERE name_pt = 'Sobremesas e Bebidas' ORDER BY sort_order LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM services WHERE name_pt = 'Bebidas Incluídas' LIMIT 1) THEN
    INSERT INTO services (category_id, name_pt, name_en, pricing_type, base_price, unit_pt, unit_en, sort_order, is_active)
    VALUES (cat_id, 'Bebidas Incluídas', 'Drinks Included', 'fixed', 0, 'serviço', 'service', 11, true)
    RETURNING id INTO svc_id;

    INSERT INTO service_included_items (service_id, section_key, text_pt, text_en, sort_order)
    VALUES
      (svc_id, 'default', 'Água', 'Water', 1),
      (svc_id, 'default', 'Refrigerantes', 'Soft drinks', 2),
      (svc_id, 'default', 'Sumos', 'Juices', 3),
      (svc_id, 'default', 'Vinho branco e tinto', 'White and red wine', 4),
      (svc_id, 'default', 'Cerveja', 'Beer', 5),
      (svc_id, 'default', 'Café', 'Coffee', 6),
      (svc_id, 'default', 'Espumante para corte do bolo', 'Sparkling wine for cake cutting', 7),
      (svc_id, 'default', 'Digestivos', 'Digestifs', 8);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 8. SEED: Bartender (Opcional) – serviço com uma opção paga (17€/pessoa)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  cat_id UUID;
  svc_id UUID;
BEGIN
  SELECT id INTO cat_id FROM service_categories WHERE name_pt = 'Sobremesas e Bebidas' ORDER BY sort_order LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM services WHERE name_pt = 'Bartender (Opcional)' LIMIT 1) THEN
    INSERT INTO services (category_id, name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, sort_order, is_active)
    VALUES (cat_id, 'Bartender (Opcional)', 'Bartender (Optional)', '1 hora durante o welcome drink + 2 horas após o jantar. Caso sejam contratadas horas adicionais após o jantar, o valor por pessoa poderá ser ajustado.', '1 hour during welcome drink + 2 hours after dinner. Additional hours after dinner may be adjusted.', 'per_person', 0, 'pessoa', 'person', 12, true)
    RETURNING id INTO svc_id;

    INSERT INTO service_priced_options (service_id, name_pt, name_en, description_pt, pricing_type, price, sort_order)
    VALUES (svc_id, 'Adicionar bartender (3h)', 'Add bartender (3h)', '17€/pessoa — 3 horas', 'per_person', 17, 1);

    INSERT INTO service_included_items (service_id, section_key, text_pt, text_en, sort_order)
    VALUES
      (svc_id, 'cocktails', 'Gin tónico', 'Gin and tonic', 1),
      (svc_id, 'cocktails', 'Caipirinha', 'Caipirinha', 2),
      (svc_id, 'cocktails', 'Mojito', 'Mojito', 3),
      (svc_id, 'cocktails', 'Whisky-cola', 'Whisky and cola', 4),
      (svc_id, 'cocktails', 'Vodka com sumo de laranja', 'Vodka with orange juice', 5),
      (svc_id, 'cocktails', 'Aperol Spritz', 'Aperol Spritz', 6),
      (svc_id, 'cocktails', 'Licor Beirão', 'Licor Beirão', 7);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 9. SEED: Extras (Opcionais) – valores sob consulta
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  cat_id UUID;
  svc_id UUID;
BEGIN
  SELECT id INTO cat_id FROM service_categories WHERE name_pt = 'Extras' ORDER BY sort_order LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM services WHERE name_pt = 'Extras (Opcionais)' LIMIT 1) THEN
    INSERT INTO services (category_id, name_pt, name_en, description_pt, description_en, pricing_type, base_price, unit_pt, unit_en, sort_order, is_active)
    VALUES (cat_id, 'Extras (Opcionais)', 'Optional Extras', 'Valores sob consulta. Serviço totalmente personalizável.', 'Prices upon request. Fully customizable service.', 'on_request', NULL, 'serviço', 'service', 20, true)
    RETURNING id INTO svc_id;

    INSERT INTO service_included_items (service_id, section_key, text_pt, text_en, sort_order)
    VALUES
      (svc_id, 'default', 'Decoração reforçada', 'Reinforced decoration', 1),
      (svc_id, 'default', 'Staff extra (serventes)', 'Extra staff (servers)', 2),
      (svc_id, 'default', 'DJ e sistema de som', 'DJ and sound system', 3),
      (svc_id, 'default', 'Guarda-sóis', 'Umbrellas', 4),
      (svc_id, 'default', 'Tenda', 'Tent', 5),
      (svc_id, 'default', 'Bebidas extra', 'Extra drinks', 6),
      (svc_id, 'default', 'Horas extra de bartender', 'Extra bartender hours', 7),
      (svc_id, 'default', 'Cadeiras adicionais', 'Additional chairs', 8);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 10. Serviços incluídos no orçamento (checklist geral)
--     Pode ser um “serviço” fixo só com lista de itens, ou usar moment_items.
--     Aqui criamos um serviço informativo “Serviços Incluídos no Orçamento”.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  cat_id UUID;
  svc_id UUID;
BEGIN
  SELECT id INTO cat_id FROM service_categories WHERE name_pt = 'Extras' ORDER BY sort_order LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM services WHERE name_pt = 'Serviços Incluídos no Orçamento' LIMIT 1) THEN
    INSERT INTO services (category_id, name_pt, name_en, pricing_type, base_price, unit_pt, unit_en, sort_order, is_active)
    VALUES (cat_id, 'Serviços Incluídos no Orçamento', 'Services Included in the Quote', 'fixed', 0, NULL, NULL, 21, true)
    RETURNING id INTO svc_id;

    INSERT INTO service_included_items (service_id, section_key, text_pt, text_en, sort_order)
    VALUES
      (svc_id, 'default', 'Montagem e desmontagem', 'Assembly and disassembly', 1),
      (svc_id, 'default', 'Transporte', 'Transport', 2),
      (svc_id, 'default', 'Loiça', 'Crockery', 3),
      (svc_id, 'default', 'Atoalhados', 'Table linens', 4),
      (svc_id, 'default', 'Mesas', 'Tables', 5),
      (svc_id, 'default', 'Talheres', 'Cutlery', 6),
      (svc_id, 'default', 'Pratos', 'Plates', 7),
      (svc_id, 'default', 'Copos', 'Glasses', 8),
      (svc_id, 'default', 'Rechauds em inox', 'Stainless steel chafing dishes', 9),
      (svc_id, 'default', 'Decoração simples', 'Simple decoration', 10),
      (svc_id, 'default', 'Lavandaria de loiça e atoalhados', 'Crockery and linen laundry', 11),
      (svc_id, 'default', 'Staff base', 'Base staff', 12);
  END IF;
END $$;

-- =============================================================================
-- FIM DO REFACTOR
-- =============================================================================
-- Próximos passos na app:
-- - UI para gerir service_options (CRUD por serviço).
-- - UI para gerir service_dishes (lista de pratos por serviço).
-- - No wizard da proposta: ao escolher um serviço que tem service_options,
--   mostrar seleção da opção (A/B1/B2) e guardar service_option_id em proposal_services.
-- - Na proposta/PDF: mostrar “Lista de Pratos à Escolha” a partir de service_dishes.
