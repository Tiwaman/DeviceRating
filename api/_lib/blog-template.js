function esc(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderHead({ title, description, keywords, image, url, type, publishedAt, updatedAt, author, tags }) {
  const ogTags = tags || [];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${keywords && keywords.length ? `<meta name="keywords" content="${esc(keywords.join(', '))}">` : ''}
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚖️</text></svg>">

<!-- Open Graph -->
<meta property="og:type" content="${type === 'article' ? 'article' : 'website'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="DeviceRating">
${publishedAt ? `<meta property="article:published_time" content="${new Date(publishedAt).toISOString()}">` : ''}
${author ? `<meta property="article:author" content="${esc(author)}">` : ''}
${ogTags.map(t => `<meta property="article:tag" content="${esc(t)}">`).join('\n')}

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0A0A0A;--white:#FAFAFA;--grey:#888;--dim:#1A1A1A;--border:#222;--keep:#00E5A0;--return:#FF4D2E;--serif:'DM Serif Display',serif;--sans:'DM Sans',sans-serif}
body{background:var(--bg);color:var(--white);font-family:var(--sans);min-height:100vh;-webkit-font-smoothing:antialiased}
a{color:var(--keep);text-decoration:none;transition:opacity .15s}
a:hover{opacity:.8}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}

/* NAV */
.nav{display:flex;align-items:center;justify-content:space-between;padding:24px 40px;border-bottom:1px solid var(--border)}
.nav-left{display:flex;align-items:center;gap:32px}
.nav-logo{display:flex;align-items:center;font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.5px;color:var(--white);text-decoration:none}
.nav-logo:hover{opacity:1}
.logo-device{color:var(--white)}
.logo-rating{color:var(--keep)}
.logo-dot{width:8px;height:8px;border-radius:50%;background:var(--keep);display:inline-block;margin-left:4px;margin-bottom:2px}
.nav-links{display:flex;gap:20px;font-size:14px}
.nav-links a{color:var(--grey);text-decoration:none;transition:color .15s}
.nav-links a:hover,.nav-links a.active{color:var(--white)}
.nav-tagline{font-size:13px;color:var(--grey);letter-spacing:0.5px}

/* BLOG LISTING */
.blog-hero{text-align:center;padding:64px 40px 48px}
.blog-hero h1{font-family:var(--serif);font-size:clamp(32px,5vw,48px);margin-bottom:12px}
.blog-hero p{font-size:16px;color:var(--grey);max-width:500px;margin:0 auto}
.posts-grid{max-width:900px;margin:0 auto;padding:0 40px 60px;display:grid;gap:32px}
.post-card{display:grid;grid-template-columns:240px 1fr;gap:28px;background:var(--dim);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:border-color .2s,transform .2s;text-decoration:none;color:var(--white)}
.post-card:hover{border-color:#444;transform:translateY(-2px);opacity:1}
.post-card-img{width:100%;height:100%;min-height:180px;object-fit:cover;background:var(--border)}
.post-card-img-placeholder{width:100%;height:100%;min-height:180px;background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;align-items:center;justify-content:center;font-size:40px}
.post-card-body{padding:24px 24px 24px 0;display:flex;flex-direction:column;justify-content:center}
.post-card-meta{font-size:12px;color:var(--grey);margin-bottom:8px;display:flex;gap:12px;align-items:center}
.post-card-category{background:rgba(0,229,160,.12);color:var(--keep);padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.post-card-title{font-family:var(--serif);font-size:22px;line-height:1.3;margin-bottom:8px}
.post-card-excerpt{font-size:14px;color:var(--grey);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.no-posts{text-align:center;padding:80px 40px;color:var(--grey);font-size:16px}

/* ARTICLE */
.article-wrap{max-width:720px;margin:0 auto;padding:48px 40px 80px}
.article-back{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--grey);margin-bottom:32px;text-decoration:none}
.article-back:hover{color:var(--white)}
.article-header{margin-bottom:40px}
.article-category{display:inline-block;background:rgba(0,229,160,.12);color:var(--keep);padding:4px 12px;border-radius:100px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:16px}
.article-header h1{font-family:var(--serif);font-size:clamp(28px,4vw,42px);line-height:1.2;margin-bottom:16px}
.article-meta{display:flex;gap:16px;font-size:13px;color:var(--grey);flex-wrap:wrap;align-items:center}
.article-tags{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.article-tag{font-size:12px;color:var(--grey);background:var(--dim);border:1px solid var(--border);padding:4px 12px;border-radius:100px}
.article-featured-img{width:100%;border-radius:16px;margin-bottom:40px;aspect-ratio:16/9;object-fit:cover}
.article-content{font-size:17px;line-height:1.8;color:#ccc}
.article-content h2{font-family:var(--serif);font-size:28px;color:var(--white);margin:48px 0 16px}
.article-content h3{font-family:var(--serif);font-size:22px;color:var(--white);margin:36px 0 12px}
.article-content p{margin-bottom:20px}
.article-content ul,.article-content ol{margin-bottom:20px;padding-left:24px}
.article-content li{margin-bottom:8px}
.article-content blockquote{border-left:3px solid var(--keep);padding:12px 20px;margin:24px 0;background:var(--dim);border-radius:0 12px 12px 0;font-style:italic;color:var(--grey)}
.article-content code{background:var(--dim);padding:2px 8px;border-radius:6px;font-size:15px;color:var(--keep)}
.article-content pre{background:var(--dim);border:1px solid var(--border);border-radius:12px;padding:20px;overflow-x:auto;margin:24px 0}
.article-content pre code{background:none;padding:0;font-size:14px;color:#ccc}
.article-content img{max-width:100%;border-radius:12px;margin:24px 0}
.article-content a{color:var(--keep);text-decoration:underline;text-underline-offset:3px}
.article-content strong{color:var(--white)}

/* DEVICE CTA CARD */
.device-cta{background:var(--dim);border:1px solid var(--border);border-radius:16px;padding:28px;margin:40px 0;display:flex;align-items:center;gap:20px;text-decoration:none;color:var(--white);transition:border-color .2s}
.device-cta:hover{border-color:var(--keep);opacity:1}
.device-cta-pct{font-family:var(--serif);font-size:42px;color:var(--keep);line-height:1}
.device-cta-body h3{font-size:16px;margin-bottom:4px}
.device-cta-body p{font-size:13px;color:var(--grey)}

/* FOOTER */
.footer{text-align:center;padding:60px 40px 40px;font-size:13px;color:#444;letter-spacing:.5px;border-top:1px solid var(--border)}

@media(max-width:768px){
  .nav{padding:18px 20px}
  .nav-logo{font-size:17px}
  .nav-left{gap:20px}
  .nav-links{gap:14px;font-size:13px}
  .blog-hero{padding:40px 20px 32px}
  .posts-grid{padding:0 20px 40px}
  .post-card{grid-template-columns:1fr}
  .post-card-img,.post-card-img-placeholder{min-height:160px}
  .post-card-body{padding:20px}
  .article-wrap{padding:32px 20px 60px}
  .device-cta{flex-direction:column;text-align:center}
}
</style>`;
}

function renderNav(activePage) {
  return `
<nav class="nav">
  <div class="nav-left">
    <a class="nav-logo" href="/"><span class="logo-device">DEVICE</span><span class="logo-rating">RATING</span><span class="logo-dot"></span></a>
    <div class="nav-links">
      <a href="/"${activePage === 'home' ? ' class="active"' : ''}>Verdicts</a>
      <a href="/blog"${activePage === 'blog' ? ' class="active"' : ''}>Blog</a>
    </div>
  </div>
  <div class="nav-tagline">the only review that matters</div>
</nav>`;
}

function renderFooter() {
  return `<footer class="footer">built different. no stars. just truth.</footer>`;
}

function renderJsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function renderBlogListing(posts, categories) {
  const catMap = {};
  for (const c of categories) catMap[c.id] = c;

  const postCards = posts.map(p => {
    const cat = p.category_id ? catMap[p.category_id] : null;
    const imgHtml = p.featured_image
      ? `<img class="post-card-img" src="${esc(p.featured_image)}" alt="${esc(p.title)}" loading="lazy">`
      : `<div class="post-card-img-placeholder">📱</div>`;
    return `
    <a class="post-card" href="/blog/${esc(p.slug)}">
      ${imgHtml}
      <div class="post-card-body">
        <div class="post-card-meta">
          ${cat ? `<span class="post-card-category">${esc(cat.name)}</span>` : ''}
          <span>${formatDate(p.published_at)}</span>
        </div>
        <div class="post-card-title">${esc(p.title)}</div>
        <div class="post-card-excerpt">${esc(p.meta_description)}</div>
      </div>
    </a>`;
  }).join('');

  const head = renderHead({
    title: 'Blog | DeviceRating',
    description: 'Device reviews, comparisons, and verdicts from real owners. Keep or return? Find out.',
    url: 'https://devicerating.com/blog',
    type: 'website'
  });

  const jsonLd = renderJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'DeviceRating Blog',
    description: 'Device reviews, comparisons, and verdicts from real owners',
    url: 'https://devicerating.com/blog'
  });

  return `${head}
${jsonLd}
</head>
<body>
${renderNav('blog')}
<section class="blog-hero">
  <h1>The Blog</h1>
  <p>Reviews, comparisons, and verdicts from real owners who put devices to the test.</p>
</section>
${posts.length > 0 ? `<div class="posts-grid">${postCards}</div>` : '<div class="no-posts">No posts yet. Check back soon.</div>'}
${renderFooter()}
</body>
</html>`;
}

function renderBlogPost(post, htmlContent, category, deviceData) {
  const head = renderHead({
    title: `${post.title} | DeviceRating`,
    description: post.meta_description,
    keywords: post.keywords,
    image: post.featured_image,
    url: `https://devicerating.com/blog/${post.slug}`,
    type: 'article',
    publishedAt: post.published_at,
    updatedAt: post.updated_at,
    author: post.author,
    tags: post.tags
  });

  const jsonLd = renderJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description,
    image: post.featured_image || undefined,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'DeviceRating', url: 'https://devicerating.com' },
    datePublished: post.published_at ? new Date(post.published_at).toISOString() : undefined,
    dateModified: post.updated_at ? new Date(post.updated_at).toISOString() : undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://devicerating.com/blog/${post.slug}` }
  });

  const catHtml = category ? `<div class="article-category">${esc(category.name)}</div>` : '';
  const tagsHtml = post.tags && post.tags.length ? `<div class="article-tags">${post.tags.map(t => `<span class="article-tag">${esc(t)}</span>`).join('')}</div>` : '';
  const featuredImg = post.featured_image ? `<img class="article-featured-img" src="${esc(post.featured_image)}" alt="${esc(post.title)}">` : '';

  let deviceCta = '';
  if (deviceData) {
    deviceCta = `
    <a class="device-cta" href="/">
      <div class="device-cta-pct">${deviceData.keep}%</div>
      <div class="device-cta-body">
        <h3>See the live verdict for ${esc(deviceData.name)}</h3>
        <p>${deviceData.keep}% would keep it &middot; ${Number(deviceData.votes).toLocaleString('en-US')} verdicts</p>
      </div>
    </a>`;
  }

  return `${head}
${jsonLd}
</head>
<body>
${renderNav('blog')}
<article class="article-wrap">
  <a class="article-back" href="/blog">&larr; All posts</a>
  <header class="article-header">
    ${catHtml}
    <h1>${esc(post.title)}</h1>
    <div class="article-meta">
      <span>By ${esc(post.author)}</span>
      <span>${formatDate(post.published_at)}</span>
    </div>
    ${tagsHtml}
  </header>
  ${featuredImg}
  <div class="article-content">${htmlContent}</div>
  ${deviceCta}
</article>
${renderFooter()}
</body>
</html>`;
}

module.exports = { renderBlogListing, renderBlogPost, esc };
