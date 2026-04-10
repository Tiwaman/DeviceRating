const { supabase } = require('./_lib/supabase');

function relativeTime(date) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all devices
    const { data: devices, error: devErr } = await supabase
      .from('devices')
      .select('*')
      .order('id');
    if (devErr) throw devErr;

    const result = {};

    for (const device of devices) {
      // Count votes
      const { count: totalVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('device_id', device.id);

      const { count: keepVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('device_id', device.id)
        .eq('vote_type', 'keep');

      // Count scraped sentiment
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

      // Blended keep percentage (70% user votes, 30% scraped)
      const userTotal = totalVotes || 0;
      const userKeep = keepVotes || 0;
      const scrKeep = scrapedKeep || 0;
      const scrReturn = scrapedReturn || 0;
      const scrTotal = scrKeep + scrReturn;

      let keepPct;
      if (userTotal === 0 && scrTotal === 0) {
        // Fall back to latest snapshot data (seed data)
        const { data: latestSnap } = await supabase
          .from('daily_snapshots')
          .select('keep_pct, total_votes')
          .eq('device_id', device.id)
          .order('snapshot_date', { ascending: false })
          .limit(1);
        if (latestSnap && latestSnap.length > 0) {
          keepPct = Math.round(latestSnap[0].keep_pct);
        } else {
          keepPct = 50;
        }
      } else if (scrTotal === 0) {
        keepPct = Math.round((userKeep / userTotal) * 100);
      } else if (userTotal === 0) {
        keepPct = Math.round((scrKeep / scrTotal) * 100);
      } else {
        const userPct = userKeep / userTotal;
        const scrPct = scrKeep / scrTotal;
        keepPct = Math.round((userPct * 0.7 + scrPct * 0.3) * 100);
      }

      // Days tracked
      const trackingSince = new Date(device.tracking_since);
      const days = Math.floor((Date.now() - trackingSince.getTime()) / 86400000);

      // Trend: compare current snapshot to 7 days ago
      const { data: snapshots } = await supabase
        .from('daily_snapshots')
        .select('keep_pct, snapshot_date')
        .eq('device_id', device.id)
        .order('snapshot_date', { ascending: false })
        .limit(2);

      let trend = 'flat';
      if (snapshots && snapshots.length >= 2) {
        const diff = snapshots[0].keep_pct - snapshots[1].keep_pct;
        if (diff > 2) trend = 'up';
        else if (diff < -2) trend = 'down';
      }

      // Latest takes
      const { data: takes } = await supabase
        .from('takes')
        .select('vote_type, text, created_at')
        .eq('device_id', device.id)
        .order('created_at', { ascending: false })
        .limit(6);

      const formattedTakes = (takes || []).map(t => ({
        type: t.vote_type,
        text: t.text,
        time: relativeTime(t.created_at)
      }));

      // Use snapshot baseline for vote count if no real votes yet
      let displayVotes = userTotal + scrTotal;
      if (displayVotes === 0 && snapshots && snapshots.length > 0) {
        displayVotes = snapshots[0].total_votes || 0;
      }

      result[device.name] = {
        slug: device.slug,
        keep: keepPct,
        votes: displayVotes,
        days,
        trend,
        takes: formattedTakes
      };
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(result);
  } catch (err) {
    console.error('Devices API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
