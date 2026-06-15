-- Sample waitlist data for local testing. Idempotent (ON CONFLICT DO NOTHING),
-- with deterministic uids/emails so referral / merge / position flows are
-- reproducible. Load with `make seed` (never auto-run on boot).
--
-- Handy fixtures:
--   AAAA1111  -> visit /?ref=AAAA1111 to test referral attribution
--   founder@pulse.ai (uid AAAA1111) -> re-join this email from another device
--                                       to test cross-device email-merge
INSERT INTO waitlist (uid, email, referrer_uid, preference) VALUES
  ('AAAA1111', 'founder@pulse.ai',  NULL,       'updates'),
  ('BBBB2222', 'early@pulse.ai',    'AAAA1111', 'launch'),
  ('CCCC3333', 'scout@pulse.ai',    'AAAA1111', 'updates'),
  ('DDDD4444', 'maker@pulse.ai',    'BBBB2222', 'launch'),
  ('EEEE5555', 'trader@pulse.ai',   'BBBB2222', 'updates'),
  ('FFFF6666', 'quant@pulse.ai',    'CCCC3333', 'launch'),
  ('GGGG7777', 'analyst@pulse.ai',  NULL,       'updates'),
  ('HHHH8888', 'builder@pulse.ai',  'DDDD4444', 'launch'),
  ('IIII9999', 'degen@pulse.ai',    'AAAA1111', 'updates'),
  ('JJJJ0000', 'whale@pulse.ai',    'GGGG7777', 'launch')
ON CONFLICT (email) DO NOTHING;
