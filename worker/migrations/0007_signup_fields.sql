-- Sign-up details (asked on first open) and the one-time free trial.
ALTER TABLE users ADD COLUMN college TEXT;
ALTER TABLE users ADD COLUMN session TEXT;
ALTER TABLE users ADD COLUMN trial_used_at INTEGER;
