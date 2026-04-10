const KEEP_WORDS = [
  'love', 'amazing', 'best', 'keeping', 'kept', 'no regrets', 'worth it',
  'recommend', 'perfect', 'excellent', 'upgrade', 'impressed', 'solid',
  'reliable', 'fast', 'smooth', 'great battery', 'stunning', 'fantastic',
  'daily driver', 'game changer', 'incredible', 'beautiful', 'premium',
  'phenomenal', 'outstanding', 'brilliant', 'flawless', 'superb',
  'not returning', 'definitely keeping', 'happy with', 'glad i bought',
  'worth every penny', 'best phone', 'best laptop', 'no complaints'
];

const RETURN_WORDS = [
  'returning', 'returned', 'regret', 'disappointing', 'overpriced',
  'overhyped', 'waste', 'buggy', 'laggy', 'overheating', 'poor battery',
  'mediocre', 'not worth', 'sending back', 'refund', "buyer's remorse",
  'downgrade', 'flimsy', 'fragile', 'broke', 'defective', 'garbage',
  'terrible', 'awful', 'worst', 'unusable', 'frustrating', 'cheap',
  'not impressed', 'going back', 'exchanging', 'underwhelming',
  'deal breaker', 'dealbreaker', 'hate it', 'junk', 'scam'
];

function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  let keepScore = 0;
  let returnScore = 0;

  for (const word of KEEP_WORDS) {
    if (lower.includes(word)) keepScore++;
  }
  for (const word of RETURN_WORDS) {
    if (lower.includes(word)) returnScore++;
  }

  const total = keepScore + returnScore;
  if (total === 0) {
    return { sentiment: 'neutral', confidence: 0 };
  }

  if (keepScore > returnScore) {
    return { sentiment: 'keep', confidence: keepScore / total };
  } else if (returnScore > keepScore) {
    return { sentiment: 'return', confidence: returnScore / total };
  }
  return { sentiment: 'neutral', confidence: 0 };
}

module.exports = { analyzeSentiment };
