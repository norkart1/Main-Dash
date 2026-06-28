import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({ title, value, sub, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-[#2c2f33] rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-[#36393f]">
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '22' }}
      >
        <Icon size={18} style={{ color }} className="sm:w-[22px] sm:h-[22px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[#72767d] text-[10px] sm:text-xs font-medium uppercase tracking-wide leading-tight">{title}</p>
        <p className="text-white text-xl sm:text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-[#72767d] text-[10px] sm:text-xs mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}
