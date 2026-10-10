CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  legal_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'BUYER',
  account_kind TEXT,
  contact_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users DROP COLUMN IF EXISTS licence_number;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',
  starting_bid NUMERIC NOT NULL,
  current_bid NUMERIC NOT NULL,
  bid_increment NUMERIC NOT NULL DEFAULT 100,
  reserve_price NUMERIC,
  condition TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LIVE',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  last_bid_at TIMESTAMPTZ,
  category_id UUID NOT NULL REFERENCES categories(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC,
  payment_method TEXT,
  bid_count INTEGER NOT NULL DEFAULT 0,
  watch_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY,
  amount NUMERIC NOT NULL,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watches (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  reference TEXT NOT NULL,
  payer_name TEXT NOT NULL,
  payer_phone TEXT,
  last4 TEXT,
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_status_ends_at_idx ON listings (status, ends_at);
CREATE INDEX IF NOT EXISTS listings_category_idx ON listings (category_id);
CREATE INDEX IF NOT EXISTS listings_seller_idx ON listings (seller_id);
CREATE INDEX IF NOT EXISTS bids_listing_idx ON bids (listing_id);
CREATE INDEX IF NOT EXISTS watches_user_idx ON watches (user_id);
