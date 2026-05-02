import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { hashPassword, createSession, createSessionCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const { username, email, password, fullName, city, bio } = await request.json();

    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Username, email, password, and full name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check existing user
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) {
      return NextResponse.json(
        { error: 'Email or username already taken' },
        { status: 409 }
      );
    }

    const id = uuidv4();
    const passwordHash = await hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, full_name, city, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, email, passwordHash, fullName, city || '', bio || '');

    // Create session
    const { sessionId, expiresAt } = createSession(id);

    const response = NextResponse.json({
      user: { id, username, email, fullName, city: city || '', skillCoins: 10, trustLevel: 'bronze' }
    }, { status: 201 });

    response.headers.set('Set-Cookie', createSessionCookie(sessionId, expiresAt));
    return response;

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
