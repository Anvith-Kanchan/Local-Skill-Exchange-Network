import { NextResponse } from 'next/server';
import { getUserFromRequest, destroySession, clearSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = getUserFromRequest(request);
    if (session) {
      destroySession(session.sessionId);
    }

    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', clearSessionCookie());
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
