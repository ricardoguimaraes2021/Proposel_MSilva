ALTER TABLE service_included_items ADD COLUMN IF NOT EXISTS catalog_item_id bigint REFERENCES catalog_items(id) ON DELETE SET NULL;
