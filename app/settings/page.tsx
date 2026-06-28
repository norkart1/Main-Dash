import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar';
import BotStatusEditor from '@/components/BotStatusEditor';
import BotProfileEditor from '@/components/BotProfileEditor';
import BotBioEditor from '@/components/BotBioEditor';
import { Settings, Lock } from 'lucide-react';
import { decodeSession } from '@/lib/session';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('botdash_session')?.value;
  const session = sessionCookie ? decodeSession(sessionCookie) : null;

  const ownerId = process.env.BOT_OWNER_ID;
  const isOwner = !!ownerId && session?.discordId === ownerId;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session ? { username: session.username, avatar: session.avatar } : null} />
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5865f2]/20 flex items-center justify-center">
              <Settings size={18} className="text-[#5865f2]" />
            </div>
            <div>
              <h1 className="text-white text-xl sm:text-2xl font-bold">Settings</h1>
              <p className="text-[#72767d] text-sm">Configure your bot behaviour and appearance</p>
            </div>
          </div>

          {!isOwner && (
            <div className="flex items-start gap-3 bg-[#faa61a]/10 border border-[#faa61a]/30 rounded-xl px-4 py-3.5 mb-5">
              <Lock size={16} className="text-[#faa61a] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#faa61a] text-sm font-semibold">Read-only</p>
                <p className="text-[#b9bbbe] text-xs mt-0.5">
                  Only the bot owner can change these settings. You can view the current configuration but cannot save changes.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <BotProfileEditor isOwner={isOwner} />
            <BotBioEditor isOwner={isOwner} />
            <BotStatusEditor isOwner={isOwner} />
          </div>
        </div>
      </main>
    </div>
  );
}
