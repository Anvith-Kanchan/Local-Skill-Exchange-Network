import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { verifyPassword, createSession, createSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last active
    db.prepare('UPDATE users SET last_active = datetime(\'now\') WHERE id = ?').run(user.id);

    const { sessionId, expiresAt } = createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        city: user.city,
        skillCoins: user.skill_coins,
        trustLevel: user.trust_level,
      }
    });

    response.headers.set('Set-Cookie', createSessionCookie(sessionId, expiresAt));
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
