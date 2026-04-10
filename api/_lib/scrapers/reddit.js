const { analyzeSentiment } = require('../sentiment');

const SUBREDDIT_MAP = {
  'iphone-16-pro': ['iphone'],
  'samsung-s25-ultra': ['samsung', 'Android'],
  'macbook-air-m3': ['macbook', 'mac'],
  'pixel-9-pro': ['GooglePixel'],
  'nothing-phone-3': ['NothingTech'],
  'oneplus-13': ['oneplus']
};

const SEARCH_TERMS = {
  'iphone-16-pro': 'iPhone 16 Pro',
  'samsung-s25-ultra': 'Samsung S25 Ultra',
  'macbook-air-m3': 'MacBook Air M3',
  'pixel-9-pro': 'Pixel 9 Pro',
  'nothing-phone-3': 'Nothing Phone 3',
  'oneplus-13': 'OnePlus 13'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeReddit(deviceSlug) {
  const subreddits = SUBREDDIT_MAP[deviceSlug] || [];
  const searchTerm = SEARCH_TERMS[deviceSlug] || deviceSlug;
  const reviews = [];

  for (const sub of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(searchTerm)}&sort=new&limit=15&restrict_sr=true&t=week`;

      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'KeepOrReturn/1.0 (devicerating.com)'
        }
      });

      if (!resp.ok) {
        console.log(`Reddit r/${sub} returned ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      const posts = data?.data?.children || [];

      for (const post of posts) {
        const p = post.data;
        if (!p || p.removed_by_category) continue;

        const text = `${p.title || ''} ${p.selftext || ''}`.trim();
        if (text.length < 20) continue;

        const { sentiment, confidence } = analyzeSentiment(text);
        if (sentiment === 'neutral') continue;

        reviews.push({
          source: 'reddit',
          source_id: `reddit-${p.id}`,
          text: text.slice(0, 500),
          sentiment,
          confidence,
          source_url: `https://reddit.com${p.permalink}`
        });
      }

      await sleep(2000); // respect rate limits
    } catch (err) {
      console.error(`Reddit scrape error for r/${sub}:`, err.message);
    }
  }

  return reviews;
}

module.exports = { scrapeReddit };
