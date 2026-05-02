import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = `
      SELECT e.*, 
        req.username as requester_username, req.full_name as requester_name, req.avatar_url as requester_avatar, req.trust_level as requester_trust,
        prov.username as provider_username, prov.full_name as provider_name, prov.avatar_url as provider_avatar, prov.trust_level as provider_trust,
        sr.name as skill_requested_name, sr.category as skill_requested_category,
        so.name as skill_offered_name, so.category as skill_offered_category
      FROM exchanges e
      JOIN users req ON e.requester_id = req.id
      JOIN users prov ON e.provider_id = prov.id
      JOIN skills sr ON e.skill_requested_id = sr.id
      LEFT JOIN skills so ON e.skill_offered_id = so.id
      WHERE (e.requester_id = ? OR e.provider_id = ?)
    `;
    const params = [session.user.id, session.user.id];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    query += ' ORDER BY e.updated_at DESC';

    const db = getDb();
    const exchanges = db.prepare(query).all(...params);
    return NextResponse.json({ exchanges });

  } catch (error) {
    console.error('Exchanges GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { providerId, skillRequestedId, skillOfferedId, type, durationHours, message, scheduledAt } = await request.json();

    if (!providerId || !skillRequestedId || !type) {
      return NextResponse.json({ error: 'Provider, skill, and type are required' }, { status: 400 });
    }

    if (providerId === session.user.id) {
      return NextResponse.json({ error: 'Cannot exchange with yourself' }, { status: 400 });
    }

    const db = getDb();

    // Check the skill exists and belongs to the provider
    const skill = db.prepare('SELECT * FROM skills WHERE id = ? AND user_id = ?').get(skillRequestedId, providerId);
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found or does not belong to provider' }, { status: 404 });
    }

    const duration = durationHours || 1;
    const coinsAmount = type === 'credit' ? skill.hourly_rate * duration : 0;

    // Credit-based: check balance and escrow
    if (type === 'credit') {
      const user = db.prepare('SELECT skill_coins FROM users WHERE id = ?').get(session.user.id);
      if (user.skill_coins < coinsAmount) {
        return NextResponse.json({ error: 'Insufficient SkillCoins' }, { status: 400 });
      }
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO exchanges (id, requester_id, provider_id, skill_offered_id, skill_requested_id, type, coins_amount, duration_hours, message, scheduled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, session.user.id, providerId, skillOfferedId || null, skillRequestedId, type, coinsAmount, duration, message || '', scheduledAt || null);

    // Create notification for provider
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, link)
      VALUES (?, ?, 'exchange_request', 'New Exchange Request', ?, '/exchanges')
    `).run(uuidv4(), providerId, `${session.user.fullName} wants to learn ${skill.name} from you!`);

    const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(id);
    return NextResponse.json({ exchange }, { status: 201 });

  } catch (error) {
    console.error('Exchanges POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
