import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId } = await params;
    const db = getDb();

    const messages = db.prepare(`
      SELECT m.*, 
        s.username as sender_username, s.full_name as sender_name, s.avatar_url as sender_avatar
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `).all(session.user.id, userId, userId, session.user.id);

    // Mark as read
    db.prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0')
      .run(userId, session.user.id);

    const partner = db.prepare('SELECT id, username, full_name, avatar_url, trust_level FROM users WHERE id = ?').get(userId);

    return NextResponse.json({ messages, partner });

  } catch (error) {
    console.error('Messages user GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
