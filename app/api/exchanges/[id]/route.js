import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { updateTrustLevel } from '@/lib/matching';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request, { params }) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    
    const exchange = db.prepare(`
      SELECT e.*, 
        req.username as requester_username, req.full_name as requester_name, req.avatar_url as requester_avatar,
        prov.username as provider_username, prov.full_name as provider_name, prov.avatar_url as provider_avatar,
        sr.name as skill_requested_name, sr.category as skill_requested_category,
        so.name as skill_offered_name, so.category as skill_offered_category
      FROM exchanges e
      JOIN users req ON e.requester_id = req.id
      JOIN users prov ON e.provider_id = prov.id
      JOIN skills sr ON e.skill_requested_id = sr.id
      LEFT JOIN skills so ON e.skill_offered_id = so.id
      WHERE e.id = ?
    `).get(id);

    if (!exchange) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });

    return NextResponse.json({ exchange });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { action, scheduledAt } = await request.json();
    const db = getDb();

    const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(id);
    if (!exchange) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });

    const isRequester = exchange.requester_id === session.user.id;
    const isProvider = exchange.provider_id === session.user.id;
    if (!isRequester && !isProvider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    switch (action) {
      case 'accept': {
        if (!isProvider) return NextResponse.json({ error: 'Only provider can accept' }, { status: 403 });
        if (exchange.status !== 'pending') return NextResponse.json({ error: 'Can only accept pending exchanges' }, { status: 400 });

        // Escrow coins if credit-based
        if (exchange.type === 'credit' && exchange.coins_amount > 0) {
          const requester = db.prepare('SELECT skill_coins FROM users WHERE id = ?').get(exchange.requester_id);
          if (requester.skill_coins < exchange.coins_amount) {
            return NextResponse.json({ error: 'Requester has insufficient SkillCoins' }, { status: 400 });
          }
          
          db.prepare('UPDATE users SET skill_coins = skill_coins - ? WHERE id = ?').run(exchange.coins_amount, exchange.requester_id);
          db.prepare('INSERT INTO transactions (id, from_user_id, to_user_id, exchange_id, amount, type, description) VALUES (?, ?, NULL, ?, ?, ?, ?)')
            .run(uuidv4(), exchange.requester_id, id, exchange.coins_amount, 'escrow_hold', 'Coins held in escrow');
        }

        db.prepare("UPDATE exchanges SET status = 'in_progress', coins_escrowed = 1, scheduled_at = ?, updated_at = datetime('now') WHERE id = ?")
          .run(scheduledAt || exchange.scheduled_at, id);

        // Create calendar events for both users
        if (scheduledAt) {
          const startTime = new Date(scheduledAt);
          const endTime = new Date(startTime.getTime() + exchange.duration_hours * 60 * 60 * 1000);
          const skill = db.prepare('SELECT name FROM skills WHERE id = ?').get(exchange.skill_requested_id);
          
          db.prepare('INSERT INTO calendar_events (id, exchange_id, user_id, title, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)')
            .run(uuidv4(), id, exchange.requester_id, `Learn: ${skill?.name || 'Skill'}`, startTime.toISOString(), endTime.toISOString());
          db.prepare('INSERT INTO calendar_events (id, exchange_id, user_id, title, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)')
            .run(uuidv4(), id, exchange.provider_id, `Teach: ${skill?.name || 'Skill'}`, startTime.toISOString(), endTime.toISOString());
        }

        // Notify requester
        db.prepare("INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?, ?, 'exchange_accepted', 'Exchange Accepted!', ?, '/exchanges')")
          .run(uuidv4(), exchange.requester_id, `Your exchange request has been accepted!`);

        break;
      }

      case 'complete': {
        if (exchange.status !== 'in_progress') return NextResponse.json({ error: 'Can only complete in-progress exchanges' }, { status: 400 });

        // Track which party confirmed
        if (isRequester) {
          db.prepare("UPDATE exchanges SET requester_confirmed = 1, updated_at = datetime('now') WHERE id = ?").run(id);
        } else {
          db.prepare("UPDATE exchanges SET provider_confirmed = 1, updated_at = datetime('now') WHERE id = ?").run(id);
        }

        // Check if both confirmed
        const updated = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(id);
        if (updated.requester_confirmed && updated.provider_confirmed) {
          db.prepare("UPDATE exchanges SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(id);

          // Release escrow
          if (exchange.type === 'credit' && exchange.coins_amount > 0) {
            db.prepare('UPDATE users SET skill_coins = skill_coins + ? WHERE id = ?').run(exchange.coins_amount, exchange.provider_id);
            db.prepare('INSERT INTO transactions (id, from_user_id, to_user_id, exchange_id, amount, type, description) VALUES (?, NULL, ?, ?, ?, ?, ?)')
              .run(uuidv4(), exchange.provider_id, id, exchange.coins_amount, 'escrow_release', 'Coins released from escrow');
          }

          // Update trust levels
          updateTrustLevel(exchange.requester_id);
          updateTrustLevel(exchange.provider_id);

          // Update calendar events
          db.prepare("UPDATE calendar_events SET status = 'completed' WHERE exchange_id = ?").run(id);
        }

        break;
      }

      case 'cancel': {
        if (!['pending', 'in_progress'].includes(exchange.status)) {
          return NextResponse.json({ error: 'Cannot cancel this exchange' }, { status: 400 });
        }

        // Refund escrowed coins
        if (exchange.coins_escrowed && exchange.type === 'credit' && exchange.coins_amount > 0) {
          db.prepare('UPDATE users SET skill_coins = skill_coins + ? WHERE id = ?').run(exchange.coins_amount, exchange.requester_id);
          db.prepare('INSERT INTO transactions (id, from_user_id, to_user_id, exchange_id, amount, type, description) VALUES (?, NULL, ?, ?, ?, ?, ?)')
            .run(uuidv4(), exchange.requester_id, id, exchange.coins_amount, 'refund', 'Escrow refunded due to cancellation');
        }

        db.prepare("UPDATE exchanges SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
        db.prepare("UPDATE calendar_events SET status = 'cancelled' WHERE exchange_id = ?").run(id);

        const otherUserId = isRequester ? exchange.provider_id : exchange.requester_id;
        db.prepare("INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?, ?, 'system', 'Exchange Cancelled', ?, '/exchanges')")
          .run(uuidv4(), otherUserId, `An exchange has been cancelled.`);

        break;
      }

      case 'dispute': {
        if (exchange.status !== 'in_progress') return NextResponse.json({ error: 'Can only dispute in-progress exchanges' }, { status: 400 });
        db.prepare("UPDATE exchanges SET status = 'disputed', updated_at = datetime('now') WHERE id = ?").run(id);
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(id);
    return NextResponse.json({ exchange: result });

  } catch (error) {
    console.error('Exchange PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
