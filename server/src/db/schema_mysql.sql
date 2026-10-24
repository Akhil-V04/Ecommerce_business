-- MySQL Schema for Srinivasa Silks
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  fabric VARCHAR(255),
  description TEXT,
  colors JSON,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INT DEFAULT 10,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  customer_alt_phone VARCHAR(32),
  fulfillment_type VARCHAR(64) NOT NULL,
  delivery_address TEXT,
  delivery_landmark VARCHAR(255),
  pin_code VARCHAR(16),
  live_location JSON,
  items JSON NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(64),
  payment_status VARCHAR(64) DEFAULT 'Pending',
  order_status VARCHAR(64) DEFAULT 'Pending',
  delivery_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
