import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');

    let query = `
      SELECT s.*, u.username, u.full_name, u.avatar_url, u.trust_level, u.reputation_score, u.city
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_active = 1
    `;
    const params = [];

    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }
    if (type) {
      query += ' AND s.type = ?';
      params.push(type);
    }
    if (search) {
      query += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (userId) {
      query += ' AND s.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY s.created_at DESC';

    const skills = db.prepare(query).all(...params);
    return NextResponse.json({ skills });

  } catch (error) {
    console.error('Skills GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, category, type, description, proficiencyLevel, hourlyRate } = await request.json();

    if (!name || !category || !type) {
      return NextResponse.json(
        { error: 'Name, category, and type are required' },
        { status: 400 }
      );
    }

    if (!['offer', 'request'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "offer" or "request"' },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO skills (id, user_id, name, category, type, description, proficiency_level, hourly_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, session.user.id, name, category, type, description || '', proficiencyLevel || 'intermediate', hourlyRate || 1);

    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(id);
    return NextResponse.json({ skill }, { status: 201 });

  } catch (error) {
    console.error('Skills POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
