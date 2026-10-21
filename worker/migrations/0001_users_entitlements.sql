-- Times are Unix epoch milliseconds.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE,
  phone TEXT UNIQUE,              -- E.164
  created_at INTEGER NOT NULL
);
CREATE TABLE entitlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  entitlement TEXT NOT NULL CHECK (entitlement IN ('qna', 'mcq', 'textbook')),
  expires_at INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('payment', 'admin')),
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (user_id, entitlement)
);
