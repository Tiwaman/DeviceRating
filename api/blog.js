const { supabase } = require('./_lib/supabase');
const { parseMarkdown } = require('./_lib/markdown');
const { renderBlogListing, renderBlogPost } = require('./_lib/blog-template');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slug = req.query.slug;

  try {
    if (slug) {
      // Single post
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error || !post) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(404).send('<!DOCTYPE html><html><head><title>Not Found</title></head><body style="background:#0A0A0A;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>404</h1><p>Post not found</p><a href="/blog" style="color:#00E5A0">Back to blog</a></div></body></html>');
      }

      const htmlContent = parseMarkdown(post.content);

      // Get category
      let category = null;
      if (post.category_id) {
        const { data: cat } = await supabase
          .from('blog_categories')
          .select('*')
          .eq('id', post.category_id)
          .single();
        category = cat;
      }

      // Get device data for cross-linking
      let deviceData = null;
      if (post.device_slug) {
        const { data: device } = await supabase
          .from('devices')
          .select('name, slug')
          .eq('slug', post.device_slug)
          .single();

        if (device) {
          // Get vote stats
          const [{ count: totalVotes }, { count: keepVotes }] = await Promise.all([
            supabase.from('votes').select('*', { count: 'exact', head: true }).eq('device_id', device.id),
            supabase.from('votes').select('*', { count: 'exact', head: true }).eq('device_id', device.id).eq('vote_type', 'keep')
          ]);

          // Fall back to snapshots if no votes
          let keep = totalVotes > 0 ? Math.round((keepVotes / totalVotes) * 100) : null;
          let votes = totalVotes || 0;

          if (keep === null) {
            const { data: snap } = await supabase
              .from('daily_snapshots')
              .select('keep_pct, total_votes')
              .eq('device_id', device.id)
              .order('snapshot_date', { ascending: false })
              .limit(1);
            if (snap && snap.length) {
              keep = Math.round(snap[0].keep_pct);
              votes = snap[0].total_votes;
            } else {
              keep = 50;
            }
          }

          deviceData = { name: device.name, keep, votes };
        }
      }

      const html = renderBlogPost(post, htmlContent, category, deviceData);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).send(html);
    } else {
      // Blog listing
      const [postsRes, catsRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('id, title, slug, meta_description, featured_image, author, published_at, tags, category_id')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(20),
        supabase.from('blog_categories').select('*')
      ]);

      const posts = postsRes.data || [];
      const categories = catsRes.data || [];

      const html = renderBlogListing(posts, categories);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
      return res.status(200).send(html);
    }
  } catch (err) {
    console.error('Blog error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
