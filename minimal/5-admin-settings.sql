CREATE TABLE IF NOT EXISTS admin_settings (id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')));
