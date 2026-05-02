import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const userId = session.user.id;

    // Stats
    const coinBalance = db.prepare('SELECT skill_coins FROM users WHERE id = ?').get(userId);
    
    const exchangeStats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' AND provider_id = ? THEN 1 END) as pending_received,
        COUNT(CASE WHEN status = 'pending' AND requester_id = ? THEN 1 END) as pending_sent,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(*) as total
      FROM exchanges
      WHERE requester_id = ? OR provider_id = ?
    `).get(userId, userId, userId, userId);

    const skillStats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN type = 'offer' THEN 1 END) as offers,
        COUNT(CASE WHEN type = 'request' THEN 1 END) as requests
      FROM skills
      WHERE user_id = ? AND is_active = 1
    `).get(userId);

    const recentExchanges = db.prepare(`
      SELECT e.*, 
        CASE WHEN e.requester_id = ? THEN prov.full_name ELSE req.full_name END as partner_name,
        CASE WHEN e.requester_id = ? THEN prov.avatar_url ELSE req.avatar_url END as partner_avatar,
        sr.name as skill_name
      FROM exchanges e
      JOIN users req ON e.requester_id = req.id
      JOIN users prov ON e.provider_id = prov.id
      JOIN skills sr ON e.skill_requested_id = sr.id
      WHERE e.requester_id = ? OR e.provider_id = ?
      ORDER BY e.updated_at DESC
      LIMIT 5
    `).all(userId, userId, userId, userId);

    const upcomingEvents = db.prepare(`
      SELECT ce.*, e.type as exchange_type,
        CASE WHEN e.requester_id = ? THEN prov.full_name ELSE req.full_name END as partner_name
      FROM calendar_events ce
      JOIN exchanges e ON ce.exchange_id = e.id
      JOIN users req ON e.requester_id = req.id
      JOIN users prov ON e.provider_id = prov.id
      WHERE ce.user_id = ? AND ce.start_time > datetime('now') AND ce.status = 'scheduled'
      ORDER BY ce.start_time ASC
      LIMIT 5
    `).all(userId, userId);

    const recentTransactions = db.prepare(`
      SELECT t.*, 
        fu.full_name as from_name, tu.full_name as to_name
      FROM transactions t
      LEFT JOIN users fu ON t.from_user_id = fu.id
      LEFT JOIN users tu ON t.to_user_id = tu.id
      WHERE t.from_user_id = ? OR t.to_user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all(userId, userId);

    const unreadMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0').get(userId);
    const unreadNotifs = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId);

    return NextResponse.json({
      coinBalance: coinBalance.skill_coins,
      exchangeStats,
      skillStats,
      recentExchanges,
      upcomingEvents,
      recentTransactions,
      unreadMessages: unreadMessages.count,
      unreadNotifications: unreadNotifs.count,
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
