BEGIN;

-- Atualizar pricing_type e permitir base_price NULL
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_pricing_type_check;
ALTER TABLE services ALTER COLUMN base_price DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_pricing_type_check'
  ) THEN
    ALTER TABLE services
      ADD CONSTRAINT services_pricing_type_check
      CHECK (pricing_type IN ('per_person', 'fixed', 'on_request'));
  END IF;
END $$;

-- Novas tabelas
CREATE TABLE IF NOT EXISTS service_included_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  text_pt TEXT NOT NULL,
  text_en TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS service_priced_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('per_person', 'fixed', 'on_request')),
  price DECIMAL(10,2),
  min_quantity INTEGER,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS proposal_service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_service_id UUID NOT NULL REFERENCES proposal_services(id) ON DELETE CASCADE,
  service_priced_option_id UUID NOT NULL REFERENCES service_priced_options(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

-- RLS
ALTER TABLE service_included_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_priced_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_service_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage service_included_items" ON service_included_items;
DROP POLICY IF EXISTS "Authenticated users can manage service_priced_options" ON service_priced_options;
DROP POLICY IF EXISTS "Authenticated users can manage proposal_service_options" ON proposal_service_options;

CREATE POLICY "Authenticated users can manage service_included_items"
  ON service_included_items FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage service_priced_options"
  ON service_priced_options FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage proposal_service_options"
  ON proposal_service_options FOR ALL
  USING (auth.role() = 'authenticated');

-- Backfill: mover included_items_pt/en para service_included_items
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

COMMIT;
