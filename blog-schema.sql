CREATE TABLE blog_categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  meta_description TEXT DEFAULT '',
  keywords TEXT[] DEFAULT '{}',
  featured_image TEXT DEFAULT '',
  content TEXT NOT NULL,
  author TEXT DEFAULT 'DeviceRating Team',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category_id INTEGER REFERENCES blog_categories(id),
  tags TEXT[] DEFAULT '{}',
  device_slug TEXT DEFAULT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);

INSERT INTO blog_categories (name, slug) VALUES
  ('Reviews', 'reviews'),
  ('Comparisons', 'comparisons'),
  ('Guides', 'guides'),
  ('News', 'news');
