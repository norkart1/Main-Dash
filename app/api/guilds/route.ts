import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const snap = await db.collection('guilds').get();
    const guilds = snap.docs
      .filter((doc) => session.guildIds.includes(doc.id))
      .map((doc) => {
        const d = doc.data();
        return { id: d.id, name: d.name, icon: d.icon, memberCount: d.memberCount };
      });
    return NextResponse.json({ guilds });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
