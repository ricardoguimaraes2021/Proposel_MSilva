-- Perfil da Empresa (singleton)
CREATE TABLE company_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'MSilva',
  tagline_pt TEXT,
  tagline_en TEXT,
  logo_url TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_website TEXT,
  contact_instagram TEXT,
  contact_facebook TEXT,
  address_street TEXT,
  address_city TEXT,
  address_postal_code TEXT,
  address_country TEXT DEFAULT 'Portugal',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias de Servicos
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servicos
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  image_url TEXT,
  
  -- Preco
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('per_person', 'fixed', 'on_request')),
  base_price DECIMAL(10,2),
  unit_pt TEXT, -- "pessoa", "base", "hora"
  unit_en TEXT, -- "person", "base", "hour"
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  
  -- Descontos por volume
  volume_discounts JSONB DEFAULT '[]',
  
  -- Items incluidos
  included_items_pt TEXT[], -- Array de strings
  included_items_en TEXT[],
  
  -- Metadata
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens incluidos (texto) dentro de um servico
CREATE TABLE service_included_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  text_pt TEXT NOT NULL,
  text_en TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Opcoes pagas dentro de um servico (extras)
CREATE TABLE service_priced_options (
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

-- Propostas
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT UNIQUE, -- "MSV-2026-001"
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  
  -- Cliente
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  
  -- Evento
  event_type TEXT NOT NULL,
  event_type_custom_pt TEXT,
  event_type_custom_en TEXT,
  event_title TEXT,
  event_date DATE,
  event_location TEXT,
  guest_count INTEGER NOT NULL,
  event_notes TEXT,
  
  -- Configuracoes
  language TEXT DEFAULT 'pt' CHECK (language IN ('pt', 'en')),
  show_vat BOOLEAN DEFAULT true,
  vat_rate DECIMAL(5,2) DEFAULT 23.00,
  valid_until DATE,
  
  -- Seccoes custom
  custom_intro_pt TEXT,
  custom_intro_en TEXT,
  terms_pt TEXT,
  terms_en TEXT,
  
  -- Totais
  subtotal DECIMAL(10,2),
  vat_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Servicos da Proposta (relacao N:N)
CREATE TABLE proposal_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Snapshot do servico (para historico)
  service_name_pt TEXT NOT NULL,
  service_name_en TEXT NOT NULL,
  pricing_type TEXT NOT NULL,
  
  -- Quantidades e precos
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  custom_price DECIMAL(10,2), -- Override manual
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Notas
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opcoes pagas escolhidas por servico na proposta
CREATE TABLE proposal_service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_service_id UUID NOT NULL REFERENCES proposal_services(id) ON DELETE CASCADE,
  service_priced_option_id UUID NOT NULL REFERENCES service_priced_options(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Templates de Termos e Condicoes
CREATE TABLE terms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content_pt TEXT NOT NULL,
  content_en TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funcao para gerar numero de referencia
CREATE OR REPLACE FUNCTION generate_proposal_reference()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  count_part INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO count_part
  FROM proposals
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  NEW.reference_number := 'MSV-' || year_part || '-' || LPAD(count_part::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_proposal_reference
  BEFORE INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION generate_proposal_reference();

-- Indices
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created ON proposals(created_at DESC);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active);

-- RLS (Row Level Security)
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_included_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_priced_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_service_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_templates ENABLE ROW LEVEL SECURITY;

-- Politicas (apenas utilizadores autenticados)
CREATE POLICY "Authenticated users can manage company_profile"
  ON company_profile FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage service_categories"
  ON service_categories FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage services"
  ON services FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage service_included_items"
  ON service_included_items FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage service_priced_options"
  ON service_priced_options FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage proposals"
  ON proposals FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage proposal_services"
  ON proposal_services FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage proposal_service_options"
  ON proposal_service_options FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage terms_templates"
  ON terms_templates FOR ALL
  USING (auth.role() = 'authenticated');
