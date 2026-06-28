import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const snap = await db.collection('botConfig').doc('profile').get();
    if (!snap.exists) return NextResponse.json({ bio: '' });
    return NextResponse.json({ bio: snap.data()?.bio || '' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ownerId = process.env.BOT_OWNER_ID;
  if (ownerId && session.discordId !== ownerId) return NextResponse.json({ error: 'Only the bot owner can change bio settings' }, { status: 403 });

  try {
    const { bio } = await req.json();
    if (typeof bio !== 'string') {
      return NextResponse.json({ error: 'bio must be a string' }, { status: 400 });
    }
    if (bio.length > 190) {
      return NextResponse.json({ error: 'Bio must be 190 characters or fewer' }, { status: 400 });
    }
    const db = getDb();
    await db.collection('botConfig').doc('profile').set(
      { bio, bioUpdatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
