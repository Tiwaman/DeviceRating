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
    const slug = req.query.device;
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);

    if (!slug) {
      return res.status(400).json({ error: 'device query param required' });
    }

    // Get device
    const { data: dev, error: devErr } = await supabase
      .from('devices')
      .select('id')
      .eq('slug', slug)
      .single();

    if (devErr || !dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const { data: takes, error: takesErr } = await supabase
      .from('takes')
      .select('vote_type, text, source, created_at')
      .eq('device_id', dev.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (takesErr) throw takesErr;

    const formatted = (takes || []).map(t => ({
      type: t.vote_type,
      source: t.source || 'user',
      text: t.text,
      time: relativeTime(t.created_at)
    }));

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Takes API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
