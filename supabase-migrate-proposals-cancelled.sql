BEGIN;

ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_status_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_status_check
  CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'cancelled'));

COMMIT;
