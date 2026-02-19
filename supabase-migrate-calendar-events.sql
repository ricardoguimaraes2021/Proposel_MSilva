BEGIN;

-- Tabela para serviços criados diretamente no calendário (sem orçamento)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  event_end_date DATE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  event_location TEXT,
  guest_count INTEGER,
  event_type TEXT DEFAULT 'other',
  notes TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage calendar_events" ON calendar_events;

CREATE POLICY "Authenticated users can manage calendar_events"
  ON calendar_events FOR ALL
  USING (auth.role() = 'authenticated');

COMMIT;
