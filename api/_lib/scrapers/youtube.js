const { analyzeSentiment } = require('../sentiment');

const SEARCH_TERMS = {
  'iphone-16-pro': 'iPhone 16 Pro review',
  'samsung-s25-ultra': 'Samsung S25 Ultra review',
  'macbook-air-m3': 'MacBook Air M3 review',
  'pixel-9-pro': 'Pixel 9 Pro review',
  'nothing-phone-3': 'Nothing Phone 3 review',
  'oneplus-13': 'OnePlus 13 review'
};

async function scrapeYouTube(deviceSlug) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.log('YouTube API key not set, skipping');
    return [];
  }

  const searchTerm = SEARCH_TERMS[deviceSlug] || `${deviceSlug} review`;
  const reviews = [];

  try {
    // Search for recent review videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchTerm)}&type=video&order=date&maxResults=3&key=${apiKey}`;
    const searchResp = await fetch(searchUrl);

    if (!searchResp.ok) {
      console.log(`YouTube search returned ${searchResp.status}`);
      return [];
    }

    const searchData = await searchResp.json();
    const videos = searchData.items || [];

    for (const video of videos) {
      const videoId = video.id?.videoId;
      if (!videoId) continue;

      try {
        // Fetch comments for this video
        const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=15&order=relevance&key=${apiKey}`;
        const commResp = await fetch(commentsUrl);

        if (!commResp.ok) continue;

        const commData = await commResp.json();
        const comments = commData.items || [];

        for (const comment of comments) {
          const snippet = comment.snippet?.topLevelComment?.snippet;
          if (!snippet) continue;

          const text = snippet.textDisplay || '';
          if (text.length < 15) continue;

          const { sentiment, confidence } = analyzeSentiment(text);
          if (sentiment === 'neutral') continue;

          reviews.push({
            source: 'youtube',
            source_id: `yt-${comment.id}`,
            text: text.replace(/<[^>]*>/g, '').slice(0, 500), // strip HTML tags
            sentiment,
            confidence,
            source_url: `https://youtube.com/watch?v=${videoId}`
          });
        }
      } catch (err) {
        console.error(`YouTube comments error for ${videoId}:`, err.message);
      }
    }
  } catch (err) {
    console.error('YouTube scrape error:', err.message);
  }

  return reviews;
}

module.exports = { scrapeYouTube };
