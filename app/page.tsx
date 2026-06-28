import { cookies } from 'next/headers';
import { Users, MessageSquare, UserPlus, Wifi } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ActivityChart from '@/components/ActivityChart';
import RecentActivity from '@/components/RecentActivity';
import { getDb } from '@/lib/firebase';
import { decodeSession } from '@/lib/session';

interface ChartPoint {
  date: string;
  messages: number;
  joins: number;
  leaves: number;
  voiceJoins: number;
}

interface ActivityItem {
  id: string;
  type: string;
  username: string;
  details: string;
  timestamp: string | null;
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  onlineCount: number;
}

async function getDashboardData(guildIds: string[]) {
  try {
    if (guildIds.length === 0) return { guilds: [], chart: [], totals: { members: 0, online: 0, messagesToday: 0, joinsToday: 0 }, activity: [] };

    const db = getDb();

    const guildsSnap = await db.collection('guilds').get();
    if (guildsSnap.empty) return { guilds: [], chart: [], totals: {}, activity: [] };

    const guilds = guildsSnap.docs
      .filter((d) => guildIds.includes(d.id))
      .map((d) => ({ id: d.id, ...d.data() })) as Guild[];

    if (guilds.length === 0) return { guilds: [], chart: [], totals: { members: 0, online: 0, messagesToday: 0, joinsToday: 0 }, activity: [] };

    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const [allStatsSnaps, actSnap] = await Promise.all([
      Promise.all(
        guilds.map((g) =>
          db.collection('guilds').doc(g.id).collection('dailyStats')
            .where('date', 'in', last7Days).get()
        )
      ),
      db.collection('guilds').doc(guilds[0].id).collection('recentActivity')
        .orderBy('timestamp', 'desc').limit(20).get(),
    ]);

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

    const activity = actSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: data.type,
        username: data.username,
        details: data.details,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
      };
    });

    return {
      guilds,
      chart,
      activity,
      totals: {
        members: guilds.reduce((s, g) => s + (g.memberCount || 0), 0),
        online: guilds.reduce((s, g) => s + (g.onlineCount || 0), 0),
        messagesToday: todayStats.messageCount || 0,
        joinsToday: todayStats.memberJoins || 0,
      },
    };
  } catch (err) {
    console.error('Dashboard data error:', err);
    return { guilds: [], chart: [], totals: { members: 0, online: 0, messagesToday: 0, joinsToday: 0 }, activity: [] };
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('botdash_session')?.value;
  const session = sessionCookie ? decodeSession(sessionCookie) : null;

  const { guilds, chart, totals, activity } = await getDashboardData(session?.guildIds ?? []);

  const hasData = guilds.length > 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session ? { username: session.username, avatar: session.avatar } : null} />

      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-white text-xl sm:text-2xl font-bold">Dashboard</h1>
            <p className="text-[#72767d] text-sm mt-1">
              {hasData
                ? `Monitoring ${guilds.length} server${guilds.length > 1 ? 's' : ''}`
                : 'No servers found — make sure you share a server with the bot'}
            </p>
          </div>

          {guilds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {guilds.map((g: Guild) => (
                <div
                  key={g.id}
                  className="flex items-center gap-2 bg-[#2c2f33] border border-[#36393f] rounded-full px-3 py-1.5"
                >
                  {g.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.icon} alt={g.name} className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#5865f2] flex items-center justify-center text-[9px] text-white font-bold">
                      {g.name[0]}
                    </div>
                  )}
                  <span className="text-[#dcddde] text-xs font-medium truncate max-w-[140px]">{g.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <StatCard title="Total Members" value={totals.members?.toLocaleString() ?? '0'} sub={`${totals.online} online`} icon={Users} color="#5865f2" />
            <StatCard title="Online Now" value={totals.online?.toLocaleString() ?? '0'} sub="across all servers" icon={Wifi} color="#57f287" />
            <StatCard title="Messages Today" value={totals.messagesToday?.toLocaleString() ?? '0'} sub="in all channels" icon={MessageSquare} color="#faa61a" />
            <StatCard title="Joins Today" value={totals.joinsToday?.toLocaleString() ?? '0'} sub="new members" icon={UserPlus} color="#eb459e" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <ActivityChart data={chart as ChartPoint[]} />
            </div>
            <div>
              <RecentActivity items={activity as ActivityItem[]} />
            </div>
          </div>

          {!hasData && (
            <div className="mt-8 bg-[#2c2f33] border border-[#36393f] rounded-xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#5865f222] flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-[#5865f2]" />
              </div>
              <h3 className="text-white font-semibold mb-2">No servers found</h3>
              <p className="text-[#72767d] text-sm max-w-sm mx-auto">
                Make sure you are in a server where this bot is active, then sign in again.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
