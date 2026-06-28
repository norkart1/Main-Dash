'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartPoint {
  date: string;
  messages: number;
  joins: number;
  leaves: number;
}

interface ActivityChartProps {
  data: ChartPoint[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e2124] border border-[#36393f] rounded-lg p-3 text-sm shadow-lg">
      <p className="text-[#b9bbbe] mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="bg-[#2c2f33] rounded-xl p-5 border border-[#36393f]">
      <h2 className="text-white font-semibold mb-4">Activity — Last 7 Days</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#36393f" />
          <XAxis dataKey="date" tick={{ fill: '#72767d', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#72767d', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 10, color: '#b9bbbe' }}
          />
          <Line type="monotone" dataKey="messages" stroke="#5865f2" strokeWidth={2} dot={false} name="Messages" />
          <Line type="monotone" dataKey="joins" stroke="#57f287" strokeWidth={2} dot={false} name="Joins" />
          <Line type="monotone" dataKey="leaves" stroke="#ed4245" strokeWidth={2} dot={false} name="Leaves" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
