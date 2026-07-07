CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  target_price NUMERIC,
  alert_sent_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PEN',
  scraped_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_scraped_at ON price_history(scraped_at);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  target_price NUMERIC(10, 2) NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
