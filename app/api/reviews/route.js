import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { updateTrustLevel } from '@/lib/matching';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { exchangeId, rating, comment } = await request.json();

    if (!exchangeId || !rating) {
      return NextResponse.json({ error: 'Exchange ID and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const db = getDb();
    const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(exchangeId);
    
    if (!exchange) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
    if (exchange.status !== 'completed') return NextResponse.json({ error: 'Can only review completed exchanges' }, { status: 400 });

    const isRequester = exchange.requester_id === session.user.id;
    const isProvider = exchange.provider_id === session.user.id;
    if (!isRequester && !isProvider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const revieweeId = isRequester ? exchange.provider_id : exchange.requester_id;

    // Check if already reviewed
    const existing = db.prepare('SELECT id FROM reviews WHERE exchange_id = ? AND reviewer_id = ?').get(exchangeId, session.user.id);
    if (existing) return NextResponse.json({ error: 'Already reviewed this exchange' }, { status: 409 });

    const id = uuidv4();
    db.prepare('INSERT INTO reviews (id, exchange_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, exchangeId, session.user.id, revieweeId, rating, comment || '');

    // Update trust level
    updateTrustLevel(revieweeId);

    // Notify reviewee
    db.prepare("INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?, ?, 'review', 'New Review', ?, '/profile')")
      .run(uuidv4(), revieweeId, `${session.user.fullName} gave you ${rating} stars!`);

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    console.error('Review POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const db = getDb();
    const reviews = db.prepare(`
      SELECT r.*, u.username as reviewer_username, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);

    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
