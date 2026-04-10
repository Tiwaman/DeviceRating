const crypto = require('crypto');
const { supabase } = require('./_lib/supabase');

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { device, type, take } = req.body;

    if (!device || !['keep', 'return'].includes(type)) {
      return res.status(400).json({ error: 'Invalid request. Need device slug and type (keep/return).' });
    }

    // Get device
    const { data: dev, error: devErr } = await supabase
      .from('devices')
      .select('id, name')
      .eq('slug', device)
      .single();

    if (devErr || !dev) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Hash IP
    const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
    const ipHash = hashIP(ip);

    // Insert vote (unique constraint prevents duplicates)
    const { error: voteErr } = await supabase
      .from('votes')
      .insert({ device_id: dev.id, vote_type: type, ip_hash: ipHash });

    if (voteErr) {
      if (voteErr.code === '23505') { // unique violation
        return res.status(409).json({ error: 'already_voted' });
      }
      throw voteErr;
    }

    // Optionally insert hot take
    if (take && take.trim().length > 0 && take.trim().length <= 80) {
      await supabase
        .from('takes')
        .insert({
          device_id: dev.id,
          vote_type: type,
          text: take.trim(),
          ip_hash: ipHash
        });
    }

    // Return updated stats
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', dev.id);

    const { count: keepVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', dev.id)
      .eq('vote_type', 'keep');

    const keepPct = totalVotes > 0 ? Math.round((keepVotes / totalVotes) * 100) : 50;

    return res.status(200).json({
      keep: keepPct,
      votes: totalVotes,
      device: dev.name
    });
  } catch (err) {
    console.error('Vote API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
