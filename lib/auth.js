import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import getDb from './db';

const SESSION_DURATION_DAYS = 7;

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createSession(userId) {
  const db = getDb();
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, userId, expiresAt);
  
  return { sessionId, expiresAt };
}

export function getSession(sessionId) {
  if (!sessionId) return null;
  
  const db = getDb();
  const session = db.prepare(`
    SELECT s.*, u.id as user_id, u.username, u.email, u.full_name, u.bio, u.avatar_url, 
           u.city, u.skill_coins, u.trust_level, u.reputation_score, u.total_exchanges
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(sessionId);
  
  if (!session) return null;
  
  return {
    sessionId: session.id,
    user: {
      id: session.user_id,
      username: session.username,
      email: session.email,
      fullName: session.full_name,
      bio: session.bio,
      avatarUrl: session.avatar_url,
      city: session.city,
      skillCoins: session.skill_coins,
      trustLevel: session.trust_level,
      reputationScore: session.reputation_score,
      totalExchanges: session.total_exchanges,
    }
  };
}

export function destroySession(sessionId) {
  if (!sessionId) return;
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function getUserFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );
  
  const sessionId = cookies['session_id'];
  if (!sessionId) return null;
  
  return getSession(sessionId);
}

export function createSessionCookie(sessionId, expiresAt) {
  return `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_DAYS * 24 * 60 * 60}`;
}

export function clearSessionCookie() {
  return 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
