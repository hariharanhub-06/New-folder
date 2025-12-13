-- Complete PostgreSQL Schema for Next.js E-commerce App
-- This is the CORRECTED schema that matches the application code

-- ============================================================
-- PRODUCTS AND INVENTORY
-- ============================================================

-- Main products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  images TEXT, -- JSON string array
  is_active BOOLEAN DEFAULT true,
  size TEXT, -- Legacy field, prefer using product_sizes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product size variants (MISSING from original schema)
CREATE TABLE IF NOT EXISTS product_sizes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, size)
);

-- ============================================================
-- ORDERS
-- ============================================================

-- Main orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  shipping_address TEXT NOT NULL, -- JSON string
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'New Order',
  transaction_id TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  cashfree_order_id TEXT,
  cashfree_payment_id TEXT,
  logistics_id TEXT,
  courier_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items (UPDATED with size column)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  size TEXT, -- Added to track which size was ordered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DISCOUNTS (UPDATED SCHEMA)
-- ============================================================

-- Flexible discount system supporting 4 types:
-- 1. Category Bundle (buy X items in category for Y price)
-- 2. Product Bundle (buy X of specific product for Y price)
-- 3. Category Percentage (X% off all items in category)
-- 4. Product Percentage (X% off specific product)
CREATE TABLE IF NOT EXISTS discounts (
  id TEXT PRIMARY KEY,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('bundle', 'percentage')),
  target_type TEXT NOT NULL CHECK (target_type IN ('category', 'product')),
  category TEXT, -- For category-based discounts
  product_id TEXT, -- For product-based discounts
  quantity INTEGER, -- For bundle discounts (buy X items)
  price DECIMAL(10, 2), -- For bundle discounts (get for Y price)
  percentage INTEGER, -- For percentage discounts (X% off)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints to ensure valid combinations
  CONSTRAINT valid_bundle CHECK (
    (discount_type = 'bundle' AND quantity IS NOT NULL AND price IS NOT NULL) OR
    (discount_type = 'percentage' AND percentage IS NOT NULL)
  ),
  CONSTRAINT valid_target CHECK (
    (target_type = 'category' AND category IS NOT NULL) OR
    (target_type = 'product' AND product_id IS NOT NULL)
  )
);

-- ============================================================
-- ADMIN (Optional - if using database auth)
-- ============================================================

CREATE TABLE IF NOT EXISTS admin (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

-- Product sizes indexes
CREATE INDEX IF NOT EXISTS idx_product_sizes_product ON product_sizes(product_id);

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Discount indexes
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(active);
CREATE INDEX IF NOT EXISTS idx_discounts_category ON discounts(category) WHERE target_type = 'category';
CREATE INDEX IF NOT EXISTS idx_discounts_product ON discounts(product_id) WHERE target_type = 'product';
