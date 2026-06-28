import { UserPlus, UserMinus, MessageSquare, Mic, MicOff } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  username: string;
  details: string;
  timestamp: string | null;
}

const icons: Record<string, { icon: typeof UserPlus; color: string; bg: string }> = {
  join: { icon: UserPlus, color: '#57f287', bg: '#57f28722' },
  leave: { icon: UserMinus, color: '#ed4245', bg: '#ed424522' },
  message: { icon: MessageSquare, color: '#5865f2', bg: '#5865f222' },
  voice_join: { icon: Mic, color: '#faa61a', bg: '#faa61a22' },
  voice_leave: { icon: MicOff, color: '#72767d', bg: '#72767d22' },
};

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-[#2c2f33] rounded-xl p-5 border border-[#36393f]">
      <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
      {items.length === 0 ? (
        <p className="text-[#72767d] text-sm text-center py-6">No recent activity</p>
      ) : (
        <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {items.map((item) => {
            const meta = icons[item.type] || icons.message;
            const Icon = meta.icon;
            return (
              <li key={item.id} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: meta.bg }}
                >
                  <Icon size={14} style={{ color: meta.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#dcddde] text-sm">
                    <span className="font-medium text-white">{item.username}</span>{' '}
                    <span className="text-[#b9bbbe]">{item.details}</span>
                  </p>
                  <p className="text-[#72767d] text-xs mt-0.5">{timeAgo(item.timestamp)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
