-- Synced user data. Progress and annotations: last write wins per key by updated_at. Notes: on conflict both are kept,
-- the existing cloud copy is renamed and flagged conflict = 1. Times in epoch ms.
CREATE TABLE user_progress (
  user_id TEXT NOT NULL REFERENCES users(id), key TEXT NOT NULL, value TEXT NOT NULL,
  updated_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, key)
);
CREATE TABLE user_notes (
  user_id TEXT NOT NULL REFERENCES users(id), key TEXT NOT NULL, value TEXT NOT NULL,
  updated_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, conflict INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, key)
);
CREATE TABLE user_annotations (
  user_id TEXT NOT NULL REFERENCES users(id), key TEXT NOT NULL, value TEXT NOT NULL,
  updated_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, key)
);
CREATE TABLE migration_uploads (
  user_id TEXT NOT NULL REFERENCES users(id), upload_id TEXT NOT NULL, result TEXT NOT NULL,
  created_at INTEGER NOT NULL, PRIMARY KEY (user_id, upload_id)
);
