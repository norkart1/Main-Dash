import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();

    if (session.guildIds.length === 0) return NextResponse.json({ activity: [] });

    const guildId = session.guildIds[0];

    const actSnap = await db
      .collection('guilds')
      .doc(guildId)
      .collection('recentActivity')
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const activity = actSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: data.type,
        userId: data.userId,
        username: data.username,
        details: data.details,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ activity });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
