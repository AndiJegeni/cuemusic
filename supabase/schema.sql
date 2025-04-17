CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  search_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE
);

-- Add any additional constraints or indexes as needed. 