module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 's-maxage=86400');
  res.status(200).send(`User-agent: *
Allow: /

Sitemap: https://devicerating.com/sitemap.xml
`);
};
