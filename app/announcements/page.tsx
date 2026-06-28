import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar';
import AnnouncementComposer from '@/components/AnnouncementComposer';
import { Megaphone } from 'lucide-react';
import { decodeSession } from '@/lib/session';

export default async function AnnouncementsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('botdash_session')?.value;
  const session = sessionCookie ? decodeSession(sessionCookie) : null;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session ? { username: session.username, avatar: session.avatar } : null} />
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5865f2]/20 flex items-center justify-center">
              <Megaphone size={18} className="text-[#5865f2]" />
            </div>
            <div>
              <h1 className="text-white text-xl sm:text-2xl font-bold">Announcements</h1>
              <p className="text-[#72767d] text-sm">
                Send announcements to your Discord servers
              </p>
            </div>
          </div>

          <AnnouncementComposer />
        </div>
      </main>
    </div>
  );
}
