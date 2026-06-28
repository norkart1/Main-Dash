import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');
  const userId = searchParams.get('userId');
  if (!guildId) return NextResponse.json({ error: 'guildId required' }, { status: 400 });
  if (!session.guildIds.includes(guildId)) return NextResponse.json({ error: 'Access denied to this server' }, { status: 403 });

  try {
    const db = getDb();
    let query = db.collection('warnings').where('guildId', '==', guildId).orderBy('timestamp', 'desc');
    if (userId) query = query.where('targetId', '==', userId) as typeof query;

    const snap = await query.limit(100).get();
    const warnings = snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, timestamp: data.timestamp?.toDate?.()?.toISOString() || null };
    });

    return NextResponse.json({ warnings });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const warningId = searchParams.get('id');
  const guildId = searchParams.get('guildId');
  if (!warningId) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (guildId && !session.guildIds.includes(guildId)) return NextResponse.json({ error: 'Access denied to this server' }, { status: 403 });

  try {
    const db = getDb();
    await db.collection('warnings').doc(warningId).delete();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
