import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();
    const skill = db.prepare(`
      SELECT s.*, u.username, u.full_name, u.avatar_url, u.trust_level, u.reputation_score
      FROM skills s JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(id);

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }
    return NextResponse.json({ skill });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(id);

    if (!skill) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    if (skill.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates = await request.json();
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (['name', 'category', 'description', 'proficiency_level', 'hourly_rate', 'is_active'].includes(dbKey)) {
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE skills SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM skills WHERE id = ?').get(id);
    return NextResponse.json({ skill: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(id);

    if (!skill) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    if (skill.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    db.prepare('UPDATE skills SET is_active = 0 WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
