BEGIN;

-- Funções/cargos (customizáveis)
CREATE TABLE IF NOT EXISTS staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  default_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funcionários
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  nif TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relação N:N staff ↔ roles (com override de valor/hora por funcionário)
CREATE TABLE IF NOT EXISTS staff_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES staff_roles(id) ON DELETE CASCADE,
  custom_hourly_rate DECIMAL(10,2),  -- Override por funcionário (NULL = usar default da role)
  UNIQUE(staff_member_id, role_id)
);

-- Atribuição de staff a serviços
CREATE TABLE IF NOT EXISTS service_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Referência ao serviço (um dos dois, o outro fica NULL)
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  -- Staff
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES staff_roles(id),
  -- Horários individuais
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  -- Override do valor/hora para este serviço específico
  custom_hourly_rate DECIMAL(10,2),
  -- Calculados (armazenados para performance)
  hours_worked DECIMAL(6,2),
  total_pay DECIMAL(10,2),
  -- Notas
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Garantir que pelo menos um dos dois FKs está preenchido
  CONSTRAINT at_least_one_service CHECK (
    calendar_event_id IS NOT NULL OR proposal_id IS NOT NULL
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_staff_members_active ON staff_members(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_member_roles_member ON staff_member_roles(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_member_roles_role ON staff_member_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_calendar ON service_staff_assignments(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_proposal ON service_staff_assignments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_member ON service_staff_assignments(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_times ON service_staff_assignments(start_time, end_time);

-- RLS
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_staff_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage staff_roles" ON staff_roles;
DROP POLICY IF EXISTS "Authenticated users can manage staff_members" ON staff_members;
DROP POLICY IF EXISTS "Authenticated users can manage staff_member_roles" ON staff_member_roles;
DROP POLICY IF EXISTS "Authenticated users can manage service_staff_assignments" ON service_staff_assignments;

CREATE POLICY "Authenticated users can manage staff_roles"
  ON staff_roles FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage staff_members"
  ON staff_members FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage staff_member_roles"
  ON staff_member_roles FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage service_staff_assignments"
  ON service_staff_assignments FOR ALL
  USING (auth.role() = 'authenticated');

COMMIT;
