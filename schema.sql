-- KeepOrReturn Supabase Schema
-- Run this in the Supabase SQL Editor

-- Devices table
CREATE TABLE devices (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  brand         TEXT NOT NULL,
  tracking_since DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table (one vote per device per IP)
CREATE TABLE votes (
  id            SERIAL PRIMARY KEY,
  device_id     INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  vote_type     TEXT NOT NULL CHECK (vote_type IN ('keep', 'return')),
  ip_hash       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, ip_hash)
);

-- Hot takes (user-submitted short opinions)
CREATE TABLE takes (
  id            SERIAL PRIMARY KEY,
  device_id     INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  vote_type     TEXT NOT NULL CHECK (vote_type IN ('keep', 'return')),
  text          TEXT NOT NULL CHECK (char_length(text) <= 80),
  ip_hash       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Scraped reviews with sentiment
CREATE TABLE scraped_reviews (
  id            SERIAL PRIMARY KEY,
  device_id     INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  source        TEXT NOT NULL,
  source_id     TEXT,
  text          TEXT NOT NULL,
  sentiment     TEXT CHECK (sentiment IN ('keep', 'return', 'neutral')),
  confidence    REAL DEFAULT 0,
  source_url    TEXT,
  scraped_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id)
);

-- Daily snapshots for trend calculation
CREATE TABLE daily_snapshots (
  id            SERIAL PRIMARY KEY,
  device_id     INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  keep_pct      REAL NOT NULL,
  total_votes   INTEGER NOT NULL,
  scraped_keep  INTEGER DEFAULT 0,
  scraped_return INTEGER DEFAULT 0,
  UNIQUE(device_id, snapshot_date)
);

-- Indexes
CREATE INDEX idx_votes_device ON votes(device_id);
CREATE INDEX idx_takes_device_created ON takes(device_id, created_at DESC);
CREATE INDEX idx_scraped_device_source ON scraped_reviews(device_id, source);
CREATE INDEX idx_snapshots_device_date ON daily_snapshots(device_id, snapshot_date DESC);

-- Seed devices
INSERT INTO devices (slug, name, brand, tracking_since) VALUES
  ('iphone-16-pro', 'iPhone 16 Pro', 'Apple', '2025-11-18'),
  ('samsung-s25-ultra', 'Samsung S25 Ultra', 'Samsung', '2026-01-01'),
  ('macbook-air-m3', 'MacBook Air M3', 'Apple', '2025-09-12'),
  ('pixel-9-pro', 'Pixel 9 Pro', 'Google', '2025-12-12'),
  ('nothing-phone-3', 'Nothing Phone 3', 'Nothing', '2026-02-04'),
  ('oneplus-13', 'OnePlus 13', 'OnePlus', '2026-01-11');

-- Seed hot takes from original data
DO $$
DECLARE
  did INTEGER;
BEGIN
  -- iPhone 16 Pro
  SELECT id INTO did FROM devices WHERE slug = 'iphone-16-pro';
  INSERT INTO takes (device_id, vote_type, text, ip_hash, created_at) VALUES
    (did, 'keep', 'Camera control finally makes sense after 2 weeks', 'seed-1', NOW() - INTERVAL '2 hours'),
    (did, 'keep', 'Battery anxiety is genuinely gone', 'seed-2', NOW() - INTERVAL '5 hours'),
    (did, 'return', 'Too heavy. My wrist lodged a formal complaint.', 'seed-3', NOW() - INTERVAL '8 hours'),
    (did, 'return', 'Paid £1200 for a slightly better camera. I''m the problem.', 'seed-4', NOW() - INTERVAL '12 hours'),
    (did, 'keep', 'Action mode video makes everything look cinematic', 'seed-5', NOW() - INTERVAL '1 day');

  -- Samsung S25 Ultra
  SELECT id INTO did FROM devices WHERE slug = 'samsung-s25-ultra';
  INSERT INTO takes (device_id, vote_type, text, ip_hash, created_at) VALUES
    (did, 'keep', 'S Pen replaced my entire notebook. Not joking.', 'seed-6', NOW() - INTERVAL '1 hour'),
    (did, 'return', 'S Pen is a gimmick I used once and forgot existed', 'seed-7', NOW() - INTERVAL '4 hours'),
    (did, 'keep', '7 years of updates is the only reason I stayed', 'seed-8', NOW() - INTERVAL '9 hours'),
    (did, 'return', 'Software bloat in 2025 is genuinely embarrassing', 'seed-9', NOW() - INTERVAL '14 hours'),
    (did, 'keep', 'Display makes every other screen look broken', 'seed-10', NOW() - INTERVAL '1 day');

  -- MacBook Air M3
  SELECT id INTO did FROM devices WHERE slug = 'macbook-air-m3';
  INSERT INTO takes (device_id, vote_type, text, ip_hash, created_at) VALUES
    (did, 'keep', '15 hour battery. Everything else is noise.', 'seed-11', NOW() - INTERVAL '30 minutes'),
    (did, 'keep', 'Fanless and never once throttled. Black magic.', 'seed-12', NOW() - INTERVAL '3 hours'),
    (did, 'return', 'No HDMI in 2024 should be a criminal offence', 'seed-13', NOW() - INTERVAL '7 hours'),
    (did, 'keep', 'Best laptop for the money. It isn''t close.', 'seed-14', NOW() - INTERVAL '11 hours'),
    (did, 'return', 'Dongle life wasn''t in the brochure', 'seed-15', NOW() - INTERVAL '1 day');

  -- Pixel 9 Pro
  SELECT id INTO did FROM devices WHERE slug = 'pixel-9-pro';
  INSERT INTO takes (device_id, vote_type, text, ip_hash, created_at) VALUES
    (did, 'keep', 'Best photos I''ve ever taken with a phone', 'seed-16', NOW() - INTERVAL '45 minutes'),
    (did, 'keep', 'Clean Android + Gemini is actually a real combo', 'seed-17', NOW() - INTERVAL '6 hours'),
    (did, 'return', 'Feels plasticky for a £1000 phone', 'seed-18', NOW() - INTERVAL '10 hours'),
    (did, 'keep', 'Night Sight at dinner = zero bad photos ever', 'seed-19', NOW() - INTERVAL '15 hours'),
    (did, 'return', 'Network coverage still behind Apple and Samsung', 'seed-20', NOW() - INTERVAL '2 days');

  -- Nothing Phone 3
  SELECT id INTO did FROM devices WHERE slug = 'nothing-phone-3';
  INSERT INTO takes (device_id, vote_type, text, ip_hash, created_at) VALUES
    (did, 'keep', 'Glyph interface sounds gimmicky until you use it daily', 'seed-21', NOW() - INTERVAL '2 hours'),
    (did, 'return', 'Paid for the aesthetic. Performance didn''t get the memo.', 'seed-22', NOW() - INTERVAL '5 hours'),
    (did, 'keep', 'Most conversations I''ve had about a phone ever', 'seed-23', NOW() - INTERVAL '9 hours'),
    (did, 'return', 'Hype was louder than the actual product', 'seed-24', NOW() - INTERVAL '13 hours'),
    (did, 'keep', 'Looks like nothing else. That alone justifies it.', 'seed-25', NOW() - INTERVAL '1 day');

  -- OnePlus 13
  SELECT id INTO did FROM devices WHERE slug = 'oneplus-13';
  INSERT INTO takes (device_id, vote_type, text, ip_hash, created_at) VALUES
    (did, 'keep', 'Hasselblad tuning actually shows in real photos', 'seed-26', NOW() - INTERVAL '1 hour'),
    (did, 'keep', 'Charges from 0 to 100 while I shower. Insane.', 'seed-27', NOW() - INTERVAL '4 hours'),
    (did, 'return', 'OxygenOS feels unfinished in small but annoying ways', 'seed-28', NOW() - INTERVAL '8 hours'),
    (did, 'keep', 'Flagship specs at £200 less than the competition', 'seed-29', NOW() - INTERVAL '12 hours'),
    (did, 'return', 'Resale value is basically zero and I knew it going in', 'seed-30', NOW() - INTERVAL '1 day');
END $$;

-- Seed initial votes to match original percentages
-- iPhone 16 Pro: 74% keep of 18420 = 13631 keep, 4789 return
-- Samsung S25 Ultra: 68% keep of 14310 = 9731 keep, 4579 return
-- MacBook Air M3: 91% keep of 22100 = 20111 keep, 1989 return
-- Pixel 9 Pro: 81% keep of 9870 = 7995 keep, 1875 return
-- Nothing Phone 3: 61% keep of 6240 = 3806 keep, 2434 return
-- OnePlus 13: 77% keep of 11580 = 8917 keep, 2663 return

-- We insert aggregate counts into daily_snapshots instead of 80K+ individual vote rows
DO $$
DECLARE
  did INTEGER;
BEGIN
  SELECT id INTO did FROM devices WHERE slug = 'iphone-16-pro';
  INSERT INTO daily_snapshots (device_id, snapshot_date, keep_pct, total_votes) VALUES
    (did, CURRENT_DATE - 7, 72, 17800),
    (did, CURRENT_DATE, 74, 18420);

  SELECT id INTO did FROM devices WHERE slug = 'samsung-s25-ultra';
  INSERT INTO daily_snapshots (device_id, snapshot_date, keep_pct, total_votes) VALUES
    (did, CURRENT_DATE - 7, 70, 13500),
    (did, CURRENT_DATE, 68, 14310);

  SELECT id INTO did FROM devices WHERE slug = 'macbook-air-m3';
  INSERT INTO daily_snapshots (device_id, snapshot_date, keep_pct, total_votes) VALUES
    (did, CURRENT_DATE - 7, 90, 21200),
    (did, CURRENT_DATE, 91, 22100);

  SELECT id INTO did FROM devices WHERE slug = 'pixel-9-pro';
  INSERT INTO daily_snapshots (device_id, snapshot_date, keep_pct, total_votes) VALUES
    (did, CURRENT_DATE - 7, 79, 9200),
    (did, CURRENT_DATE, 81, 9870);

  SELECT id INTO did FROM devices WHERE slug = 'nothing-phone-3';
  INSERT INTO daily_snapshots (device_id, snapshot_date, keep_pct, total_votes) VALUES
    (did, CURRENT_DATE - 7, 62, 5800),
    (did, CURRENT_DATE, 61, 6240);

  SELECT id INTO did FROM devices WHERE slug = 'oneplus-13';
  INSERT INTO daily_snapshots (device_id, snapshot_date, keep_pct, total_votes) VALUES
    (did, CURRENT_DATE - 7, 75, 10900),
    (did, CURRENT_DATE, 77, 11580);
END $$;
