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
    // Fetch ALL data in parallel — 5 queries total instead of 30+
    const [devicesRes, votesRes, scrapedRes, snapshotsRes, takesRes] = await Promise.all([
      supabase.from('devices').select('*').order('id'),
      supabase.from('votes').select('device_id, vote_type'),
      supabase.from('scraped_reviews').select('device_id, sentiment').in('sentiment', ['keep', 'return']),
      supabase.from('daily_snapshots').select('device_id, keep_pct, total_votes, snapshot_date').order('snapshot_date', { ascending: false }),
      supabase.from('takes').select('device_id, vote_type, text, source, created_at').order('created_at', { ascending: false }).limit(50)
    ]);

    if (devicesRes.error) throw devicesRes.error;

    const devices = devicesRes.data;
    const allVotes = votesRes.data || [];
    const allScraped = scrapedRes.data || [];
    const allSnapshots = snapshotsRes.data || [];
    const allTakes = takesRes.data || [];

    // Pre-aggregate votes by device
    const votesByDevice = {};
    for (const v of allVotes) {
      if (!votesByDevice[v.device_id]) votesByDevice[v.device_id] = { total: 0, keep: 0 };
      votesByDevice[v.device_id].total++;
      if (v.vote_type === 'keep') votesByDevice[v.device_id].keep++;
    }

    // Pre-aggregate scraped by device
    const scrapedByDevice = {};
    for (const s of allScraped) {
      if (!scrapedByDevice[s.device_id]) scrapedByDevice[s.device_id] = { keep: 0, return: 0 };
      scrapedByDevice[s.device_id][s.sentiment]++;
    }

    // Group snapshots by device (already sorted desc)
    const snapsByDevice = {};
    for (const s of allSnapshots) {
      if (!snapsByDevice[s.device_id]) snapsByDevice[s.device_id] = [];
      if (snapsByDevice[s.device_id].length < 2) snapsByDevice[s.device_id].push(s);
    }

    // Group takes by device (already sorted desc, limit per device)
    const takesByDevice = {};
    for (const t of allTakes) {
      if (!takesByDevice[t.device_id]) takesByDevice[t.device_id] = [];
      if (takesByDevice[t.device_id].length < 6) takesByDevice[t.device_id].push(t);
    }

    const result = {};

    for (const device of devices) {
      const v = votesByDevice[device.id] || { total: 0, keep: 0 };
      const s = scrapedByDevice[device.id] || { keep: 0, return: 0 };
      const snaps = snapsByDevice[device.id] || [];
      const takes = takesByDevice[device.id] || [];

      const userTotal = v.total;
      const userKeep = v.keep;
      const scrTotal = s.keep + s.return;

      let keepPct;
      if (userTotal === 0 && scrTotal === 0) {
        keepPct = snaps.length > 0 ? Math.round(snaps[0].keep_pct) : 50;
      } else if (scrTotal === 0) {
        keepPct = Math.round((userKeep / userTotal) * 100);
      } else if (userTotal === 0) {
        keepPct = Math.round((s.keep / scrTotal) * 100);
      } else {
        keepPct = Math.round(((userKeep / userTotal) * 0.7 + (s.keep / scrTotal) * 0.3) * 100);
      }

      const days = Math.floor((Date.now() - new Date(device.tracking_since).getTime()) / 86400000);

      let trend = 'flat';
      if (snaps.length >= 2) {
        const diff = snaps[0].keep_pct - snaps[1].keep_pct;
        if (diff > 2) trend = 'up';
        else if (diff < -2) trend = 'down';
      }

      let displayVotes = userTotal + scrTotal;
      if (displayVotes === 0 && snaps.length > 0) {
        displayVotes = snaps[0].total_votes || 0;
      }

      result[device.name] = {
        slug: device.slug,
        keep: keepPct,
        votes: displayVotes,
        days,
        trend,
        takes: takes.map(t => ({
          type: t.vote_type,
          text: t.text,
          source: t.source || 'user',
          time: relativeTime(t.created_at)
        }))
      };
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(result);
  } catch (err) {
    console.error('Devices API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
