-- Payments. Amounts in minor units (poisha). payment_orders doubles as the purchases record.
CREATE TABLE payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE,         -- our tran_id sent to the gateway
  user_id TEXT NOT NULL REFERENCES users(id),
  bundle TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  gateway_ref TEXT,                      -- gateway validation id once paid
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE INDEX payment_orders_user ON payment_orders(user_id, created_at);
CREATE INDEX payment_orders_status ON payment_orders(status, created_at);
CREATE TABLE payment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,         -- gateway validation/transaction id: a duplicate callback cannot be processed twice
  order_id TEXT NOT NULL REFERENCES payment_orders(order_id),
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE REFERENCES payment_orders(order_id),
  receipt_no TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id),
  bundle TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  issued_at INTEGER NOT NULL
);
