import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const user = db.prepare(`
      SELECT id, username, full_name, bio, avatar_url, city, skill_coins, trust_level, reputation_score, total_exchanges, created_at
      FROM users WHERE id = ?
    `).get(id);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const skills = db.prepare('SELECT * FROM skills WHERE user_id = ? AND is_active = 1').all(id);
    const reviews = db.prepare(`
      SELECT r.*, u.username as reviewer_username, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM reviews r JOIN users u ON r.reviewer_id = u.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `).all(id);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        city: user.city,
        skillCoins: user.skill_coins,
        trustLevel: user.trust_level,
        reputationScore: user.reputation_score,
        totalExchanges: user.total_exchanges,
        createdAt: user.created_at,
      },
      skills,
      reviews,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates = await request.json();
    const db = getDb();
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key === 'fullName' ? 'full_name' : key === 'avatarUrl' ? 'avatar_url' : key;
      if (['full_name', 'bio', 'avatar_url', 'city'].includes(dbKey)) {
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        city: user.city,
        skillCoins: user.skill_coins,
        trustLevel: user.trust_level,
        reputationScore: user.reputation_score,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
