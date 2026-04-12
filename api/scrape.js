const { supabase } = require('./_lib/supabase');
const { scrapeReddit } = require('./_lib/scrapers/reddit');
const { scrapeYouTube } = require('./_lib/scrapers/youtube');

module.exports = async function handler(req, res) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all devices
    const { data: devices, error: devErr } = await supabase
      .from('devices')
      .select('id, slug, name')
      .order('id');
    if (devErr) throw devErr;

    // Rotate: scrape 1 device per day based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const deviceIndex = dayOfYear % devices.length;
    const device = devices[deviceIndex];

    console.log(`Scraping device: ${device.name} (index ${deviceIndex}, day ${dayOfYear})`);

    // Run scrapers
    const [redditReviews, youtubeReviews] = await Promise.all([
      scrapeReddit(device.slug),
      scrapeYouTube(device.slug)
    ]);

    const allReviews = [...redditReviews, ...youtubeReviews];
    let inserted = 0;
    let skipped = 0;

    // Insert scraped reviews (skip duplicates via ON CONFLICT)
    for (const review of allReviews) {
      const { error } = await supabase
        .from('scraped_reviews')
        .upsert({
          device_id: device.id,
          source: review.source,
          source_id: review.source_id,
          text: review.text,
          sentiment: review.sentiment,
          confidence: review.confidence,
          source_url: review.source_url
        }, {
          onConflict: 'source,source_id',
          ignoreDuplicates: true
        });

      if (error) {
        skipped++;
      } else {
        inserted++;
        // Also insert as a hot take with source attribution (short enough reviews only)
        if (review.sentiment !== 'neutral' && review.text.length <= 80) {
          await supabase
            .from('takes')
            .insert({
              device_id: device.id,
              vote_type: review.sentiment,
              text: review.text,
              source: review.source,
              ip_hash: 'scraper-' + review.source_id
            });
        }
      }
    }

    // Update daily snapshot
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', device.id);

    const { count: keepVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', device.id)
      .eq('vote_type', 'keep');

    const { count: scrapedKeep } = await supabase
      .from('scraped_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', device.id)
      .eq('sentiment', 'keep');

    const { count: scrapedReturn } = await supabase
      .from('scraped_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', device.id)
      .eq('sentiment', 'return');

    const total = (totalVotes || 0) + (scrapedKeep || 0) + (scrapedReturn || 0);
    const keeps = (keepVotes || 0) + (scrapedKeep || 0);
    const keepPct = total > 0 ? Math.round((keeps / total) * 100) : 50;

    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('daily_snapshots')
      .upsert({
        device_id: device.id,
        snapshot_date: today,
        keep_pct: keepPct,
        total_votes: total,
        scraped_keep: scrapedKeep || 0,
        scraped_return: scrapedReturn || 0
      }, {
        onConflict: 'device_id,snapshot_date'
      });

    // Cleanup: remove scraped reviews older than 90 days
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    await supabase
      .from('scraped_reviews')
      .delete()
      .lt('scraped_at', cutoff);

    const summary = {
      device: device.name,
      scraped: allReviews.length,
      inserted,
      skipped,
      snapshot: { keepPct, totalVotes: total }
    };

    console.log('Scrape complete:', JSON.stringify(summary));
    return res.status(200).json(summary);
  } catch (err) {
    console.error('Scrape error:', err);
    return res.status(500).json({ error: 'Scrape failed', message: err.message });
  }
};
