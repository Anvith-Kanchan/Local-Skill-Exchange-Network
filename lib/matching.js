import getDb from './db';

/**
 * Skill Matching Algorithm
 * 
 * Scores potential matches based on:
 * - Category Match (35%): Do they offer what you need?
 * - Reciprocity (25%): Can you also offer what they need? (enables direct barter)
 * - Trust Score (20%): Higher reputation = better match
 * - Proficiency Match (10%): Expert teaching beginner is ideal
 * - Activity Recency (10%): Recently active users ranked higher
 */

const WEIGHTS = {
  categoryMatch: 0.35,
  reciprocity: 0.25,
  trustScore: 0.20,
  proficiencyMatch: 0.10,
  activityRecency: 0.10,
};

const PROFICIENCY_LEVELS = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

const TRUST_LEVELS = {
  bronze: 0.25,
  silver: 0.50,
  gold: 0.75,
  platinum: 1.0,
};

export function findMatches(userId, options = {}) {
  const db = getDb();
  const { category, limit = 20 } = options;

  // Get current user's skills
  const userOffers = db.prepare(
    'SELECT * FROM skills WHERE user_id = ? AND type = ? AND is_active = 1'
  ).all(userId, 'offer');

  const userRequests = db.prepare(
    'SELECT * FROM skills WHERE user_id = ? AND type = ? AND is_active = 1'
  ).all(userId, 'request');

  if (userRequests.length === 0) return [];

  // Get all other users with active skills
  let query = `
    SELECT DISTINCT u.*, 
      GROUP_CONCAT(DISTINCT CASE WHEN s.type = 'offer' THEN s.id || '::' || s.name || '::' || s.category || '::' || s.proficiency_level END) as offers,
      GROUP_CONCAT(DISTINCT CASE WHEN s.type = 'request' THEN s.id || '::' || s.name || '::' || s.category || '::' || s.proficiency_level END) as requests
    FROM users u
    JOIN skills s ON u.id = s.user_id AND s.is_active = 1
    WHERE u.id != ?
    GROUP BY u.id
  `;
  
  const otherUsers = db.prepare(query).all(userId);

  const matches = [];

  for (const other of otherUsers) {
    const otherOffers = parseSkillGroup(other.offers);
    const otherRequests = parseSkillGroup(other.requests);

    // Category match: do they offer what I need?
    let categoryScore = 0;
    let matchedSkills = [];
    
    for (const myReq of userRequests) {
      for (const theirOffer of otherOffers) {
        if (category && theirOffer.category !== category) continue;
        
        const nameMatch = fuzzyMatch(myReq.name, theirOffer.name);
        const catMatch = myReq.category === theirOffer.category ? 1 : 0;
        const score = nameMatch * 0.7 + catMatch * 0.3;
        
        if (score > 0.3) {
          categoryScore = Math.max(categoryScore, score);
          matchedSkills.push({
            myRequest: { id: myReq.id, name: myReq.name, category: myReq.category },
            theirOffer: { id: theirOffer.id, name: theirOffer.name, category: theirOffer.category, proficiency: theirOffer.proficiency },
          });
        }
      }
    }

    if (categoryScore === 0) continue;

    // Reciprocity: can I offer what they need?
    let reciprocityScore = 0;
    let reciprocalSkills = [];
    
    for (const myOffer of userOffers) {
      for (const theirReq of otherRequests) {
        const nameMatch = fuzzyMatch(myOffer.name, theirReq.name);
        const catMatch = myOffer.category === theirReq.category ? 1 : 0;
        const score = nameMatch * 0.7 + catMatch * 0.3;
        
        if (score > 0.3) {
          reciprocityScore = Math.max(reciprocityScore, score);
          reciprocalSkills.push({
            myOffer: { id: myOffer.id, name: myOffer.name, category: myOffer.category },
            theirRequest: { id: theirReq.id, name: theirReq.name, category: theirReq.category },
          });
        }
      }
    }

    // Trust score
    const trustScore = TRUST_LEVELS[other.trust_level] || 0.25;
    const repNormalized = Math.min(other.reputation_score / 5, 1);
    const combinedTrust = (trustScore + repNormalized) / 2;

    // Proficiency match
    let proficiencyScore = 0;
    if (matchedSkills.length > 0) {
      const bestMatch = matchedSkills[0];
      const providerLevel = PROFICIENCY_LEVELS[bestMatch.theirOffer.proficiency] || 2;
      proficiencyScore = Math.min(providerLevel / 4, 1);
    }

    // Activity recency
    const lastActive = new Date(other.last_active);
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    const activityScore = Math.max(0, 1 - daysSinceActive / 30);

    // Final weighted score
    const finalScore = 
      WEIGHTS.categoryMatch * categoryScore +
      WEIGHTS.reciprocity * reciprocityScore +
      WEIGHTS.trustScore * combinedTrust +
      WEIGHTS.proficiencyMatch * proficiencyScore +
      WEIGHTS.activityRecency * activityScore;

    matches.push({
      user: {
        id: other.id,
        username: other.username,
        fullName: other.full_name,
        avatarUrl: other.avatar_url,
        city: other.city,
        trustLevel: other.trust_level,
        reputationScore: other.reputation_score,
        totalExchanges: other.total_exchanges,
        skillCoins: other.skill_coins,
      },
      score: Math.round(finalScore * 100),
      matchedSkills,
      reciprocalSkills,
      canBarter: reciprocityScore > 0.3,
      breakdown: {
        categoryMatch: Math.round(categoryScore * 100),
        reciprocity: Math.round(reciprocityScore * 100),
        trust: Math.round(combinedTrust * 100),
        proficiency: Math.round(proficiencyScore * 100),
        activity: Math.round(activityScore * 100),
      }
    });
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

function parseSkillGroup(str) {
  if (!str) return [];
  return str.split(',').map(s => {
    const [id, name, category, proficiency] = s.split('::');
    return { id, name, category, proficiency };
  }).filter(s => s.id && s.name);
}

function fuzzyMatch(str1, str2) {
  const a = str1.toLowerCase().trim();
  const b = str2.toLowerCase().trim();
  
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;
  
  // Word overlap
  const words1 = new Set(a.split(/\s+/));
  const words2 = new Set(b.split(/\s+/));
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  return intersection.length / union.size;
}

export function updateTrustLevel(userId) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return;

  const reviews = db.prepare(
    'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewee_id = ?'
  ).get(userId);

  const completedExchanges = db.prepare(
    "SELECT COUNT(*) as count FROM exchanges WHERE (requester_id = ? OR provider_id = ?) AND status = 'completed'"
  ).get(userId, userId);

  let trustLevel = 'bronze';
  const avgRating = reviews.avg_rating || 0;
  const exchangeCount = completedExchanges.count;

  if (exchangeCount >= 20 && avgRating >= 4.5) {
    trustLevel = 'platinum';
  } else if (exchangeCount >= 10 && avgRating >= 4.0) {
    trustLevel = 'gold';
  } else if (exchangeCount >= 5 && avgRating >= 3.5) {
    trustLevel = 'silver';
  }

  db.prepare('UPDATE users SET trust_level = ?, reputation_score = ?, total_exchanges = ? WHERE id = ?')
    .run(trustLevel, avgRating, exchangeCount, userId);
}
