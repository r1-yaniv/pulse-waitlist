-- Waitlist schema. Idempotent: safe to run on every boot. NEVER add destructive
-- statements here (no DROP) — this runs automatically when the server starts.
CREATE TABLE IF NOT EXISTS waitlist (
  idx          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- joining order == "you are #N"
  uid          CHAR(8)     NOT NULL UNIQUE,                      -- visitor's own referral token
  email        TEXT        NOT NULL UNIQUE,                      -- stored lower(trim(...))
  referrer_uid CHAR(8),                                          -- nullable, NO foreign key
  preference   TEXT        NOT NULL DEFAULT 'launch'
               CHECK (preference IN ('updates', 'launch')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waitlist_uid_idx ON waitlist (uid);
