import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { findMatches } from '@/lib/matching';

export async function GET(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    const matches = findMatches(session.user.id, { category, limit });
    return NextResponse.json({ matches });

  } catch (error) {
    console.error('Matches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
