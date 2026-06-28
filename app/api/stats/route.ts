import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();

    const guildsSnap = await db.collection('guilds').get();
    if (guildsSnap.empty) {
      return NextResponse.json({ guilds: [], chart: [], totals: {} });
    }

    const guilds = guildsSnap.docs
      .filter((d) => session.guildIds.includes(d.id))
      .map((d) => ({ id: d.id, ...d.data() }));

    if (guilds.length === 0) {
      return NextResponse.json({ guilds: [], chart: [], totals: { members: 0, online: 0, messagesToday: 0, joinsToday: 0 } });
    }

    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const allStatsSnaps = await Promise.all(
      guilds.map((g) =>
        db.collection('guilds').doc(g.id).collection('dailyStats')
          .where('date', 'in', last7Days).get()
      )
    );

    const statsMap: Record<string, Record<string, number>> = {};
    for (const snap of allStatsSnaps) {
      for (const doc of snap.docs) {
        const data = doc.data() as Record<string, number>;
        if (!statsMap[doc.id]) {
          statsMap[doc.id] = { messageCount: 0, memberJoins: 0, memberLeaves: 0, voiceJoins: 0 };
        }
        statsMap[doc.id].messageCount  = (statsMap[doc.id].messageCount  || 0) + (data.messageCount  || 0);
        statsMap[doc.id].memberJoins   = (statsMap[doc.id].memberJoins   || 0) + (data.memberJoins   || 0);
        statsMap[doc.id].memberLeaves  = (statsMap[doc.id].memberLeaves  || 0) + (data.memberLeaves  || 0);
        statsMap[doc.id].voiceJoins    = (statsMap[doc.id].voiceJoins    || 0) + (data.voiceJoins    || 0);
      }
    }

    const chart = last7Days.map((date) => ({
      date: date.slice(5),
      messages: statsMap[date]?.messageCount || 0,
      joins:    statsMap[date]?.memberJoins  || 0,
      leaves:   statsMap[date]?.memberLeaves || 0,
      voiceJoins: statsMap[date]?.voiceJoins || 0,
    }));

    const today = last7Days[6];
    const todayStats = statsMap[today] || {};

    return NextResponse.json({
      guilds,
      chart,
      totals: {
        members: guilds.reduce((s: number, g: Record<string, unknown>) => s + ((g.memberCount as number) || 0), 0),
        online: guilds.reduce((s: number, g: Record<string, unknown>) => s + ((g.onlineCount as number) || 0), 0),
        messagesToday: todayStats.messageCount || 0,
        joinsToday: todayStats.memberJoins || 0,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
