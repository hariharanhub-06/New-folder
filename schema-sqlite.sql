-- SQLite Schema
-- Store at: data/store.db

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  images TEXT, -- JSON array
  is_active INTEGER DEFAULT 1, -- 1 = true, 0 = false
  size TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  shipping_address TEXT NOT NULL, -- JSON
  total_amount REAL NOT NULL,
  shipping_cost REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'New Order',
  transaction_id TEXT,
  cashfree_order_id TEXT,
  cashfree_payment_id TEXT, -- Storing Razorpay Payment ID here as well
  logistics_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Discounts
CREATE TABLE IF NOT EXISTS discounts (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Admin
CREATE TABLE IF NOT EXISTS admin_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Initial Admin Password (placeholder)
INSERT OR IGNORE INTO admin_settings (id, key, value) 
VALUES ('1', 'admin_username', 'admin'), 
       ('2', 'admin_password', '$2a$10$placeholder');
