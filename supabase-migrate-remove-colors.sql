-- Remove a coluna colors da tabela company_profile (paleta já não é utilizada).
ALTER TABLE company_profile DROP COLUMN IF EXISTS colors;
