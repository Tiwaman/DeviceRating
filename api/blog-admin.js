const { supabase } = require('./_lib/supabase');

function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return false;
  return auth.slice(7) === process.env.BLOG_ADMIN_KEY;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const id = req.query.id;

      if (id) {
        // Single post for editing
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      // List all posts (including drafts)
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, published_at, created_at, category_id')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: categories } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      const { data: devices } = await supabase
        .from('devices')
        .select('slug, name')
        .order('name');

      return res.status(200).json({ posts: posts || [], categories: categories || [], devices: devices || [] });
    }

    if (req.method === 'POST') {
      const { title, slug, meta_description, keywords, featured_image, content, author, status, category_id, tags, device_slug, published_at } = req.body;

      if (!title || !slug || !content) {
        return res.status(400).json({ error: 'title, slug, and content are required' });
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          meta_description: meta_description || '',
          keywords: keywords || [],
          featured_image: featured_image || '',
          content,
          author: author || 'DeviceRating Team',
          status: status || 'draft',
          category_id: category_id || null,
          tags: tags || [],
          device_slug: device_slug || null,
          published_at: status === 'published' ? (published_at || new Date().toISOString()) : null
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      if (updates.slug) {
        updates.slug = updates.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      }

      updates.updated_at = new Date().toISOString();

      if (updates.status === 'published' && !updates.published_at) {
        // Check if it was already published
        const { data: existing } = await supabase
          .from('blog_posts')
          .select('published_at')
          .eq('id', id)
          .single();
        if (!existing?.published_at) {
          updates.published_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id query param required' });

      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Blog admin error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
