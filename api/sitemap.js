const { supabase } = require('./_lib/supabase');

module.exports = async function handler(req, res) {
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const now = new Date().toISOString().split('T')[0];

    let urls = `
  <url>
    <loc>https://devicerating.com/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://devicerating.com/blog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    if (posts) {
      for (const p of posts) {
        const lastmod = (p.updated_at || p.published_at || now).split('T')[0];
        urls += `
  <url>
    <loc>https://devicerating.com/blog/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    return res.status(500).send('Error generating sitemap');
  }
};
