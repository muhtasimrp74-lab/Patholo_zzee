-- Password sign-in (until SMS codes exist) and manual bKash payments (until a gateway exists).
ALTER TABLE users ADD COLUMN password_hash TEXT;            -- 'pbkdf2$<iterations>$<salt>$<hash>'
ALTER TABLE payment_orders ADD COLUMN trx_id TEXT;          -- bKash transaction id typed by the buyer
ALTER TABLE payment_orders ADD COLUMN submitted_at INTEGER;
CREATE UNIQUE INDEX payment_orders_trx ON payment_orders(trx_id);
