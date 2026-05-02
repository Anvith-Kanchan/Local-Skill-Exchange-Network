import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const events = db.prepare(`
      SELECT ce.*, e.status as exchange_status, e.type as exchange_type,
        CASE WHEN e.requester_id = ? THEN prov.full_name ELSE req.full_name END as partner_name,
        CASE WHEN e.requester_id = ? THEN prov.avatar_url ELSE req.avatar_url END as partner_avatar
      FROM calendar_events ce
      JOIN exchanges e ON ce.exchange_id = e.id
      JOIN users req ON e.requester_id = req.id
      JOIN users prov ON e.provider_id = prov.id
      WHERE ce.user_id = ?
      ORDER BY ce.start_time ASC
    `).all(session.user.id, session.user.id, session.user.id);

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
