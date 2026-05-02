import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    
    // Get conversations (latest message per conversation partner)
    const conversations = db.prepare(`
      SELECT 
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partner_id,
        u.username as partner_username,
        u.full_name as partner_name,
        u.avatar_url as partner_avatar,
        u.trust_level as partner_trust,
        m.content as last_message,
        m.created_at as last_message_at,
        m.sender_id as last_sender_id,
        (SELECT COUNT(*) FROM messages m2 WHERE m2.sender_id = partner_id AND m2.receiver_id = ? AND m2.is_read = 0) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY partner_id
      ORDER BY m.created_at DESC
    `).all(session.user.id, session.user.id, session.user.id, session.user.id, session.user.id);

    // Deduplicate and get latest message per partner
    const partnerMap = new Map();
    for (const conv of conversations) {
      if (!partnerMap.has(conv.partner_id) || new Date(conv.last_message_at) > new Date(partnerMap.get(conv.partner_id).last_message_at)) {
        partnerMap.set(conv.partner_id, conv);
      }
    }

    return NextResponse.json({ conversations: Array.from(partnerMap.values()) });

  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { receiverId, content, exchangeId } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver and content are required' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO messages (id, sender_id, receiver_id, exchange_id, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, session.user.id, receiverId, exchangeId || null, content);

    // Create notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, link)
      VALUES (?, ?, 'message', 'New Message', ?, '/chat')
    `).run(uuidv4(), receiverId, `${session.user.fullName}: ${content.substring(0, 100)}`);

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    return NextResponse.json({ message }, { status: 201 });

  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
