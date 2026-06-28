'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Activity, Settings, Bot, LogOut, Menu, X, Megaphone, Shield } from 'lucide-react';

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Megaphone, label: 'Announcements', href: '/announcements' },
  { icon: Shield, label: 'Moderation', href: '/moderation' },
  { icon: Users, label: 'Members', href: '#' },
  { icon: Activity, label: 'Activity', href: '#' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

interface SidebarUser {
  username: string;
  avatar: string | null;
}

function SidebarContent({ user, onClose }: { user: SidebarUser | null; onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.username}/${user.avatar}.png?size=32`
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#2c2f33]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#5865f2] flex items-center justify-center flex-shrink-0">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">BotDash</p>
            <p className="text-[#72767d] text-xs">Control Panel</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#72767d] hover:text-white transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#5865f2]/20 text-white'
                  : 'text-[#b9bbbe] hover:bg-[#2c2f33] hover:text-white'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#5865f2]' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#2c2f33] space-y-3">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-1">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={user.username} className="w-7 h-7 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[#dcddde] text-xs font-medium truncate">{user.username}</span>
          </div>
        )}
        <div className="flex items-center gap-2 px-3">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block flex-shrink-0" />
          <span className="text-[#72767d] text-xs">Bot Online</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-[#72767d] hover:bg-[#ed4245]/10 hover:text-[#ed4245] transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ user = null }: { user?: SidebarUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#1e2124] border-b border-[#2c2f33] flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-[#b9bbbe] hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">BotDash</span>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[#1e2124] border-r border-[#2c2f33] z-40 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent user={user} onClose={() => setMobileOpen(false)} />
      </aside>

      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-60 bg-[#1e2124] border-r border-[#2c2f33] z-10">
        <SidebarContent user={user} />
      </aside>
    </>
  );
}
