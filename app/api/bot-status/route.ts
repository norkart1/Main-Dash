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
    const snap = await db.collection('botConfig').doc('status').get();
    if (!snap.exists) {
      return NextResponse.json({ type: 'WATCHING', text: 'your server 👀' });
    }
    return NextResponse.json(snap.data());
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ownerId = process.env.BOT_OWNER_ID;
  if (ownerId && session.discordId !== ownerId) return NextResponse.json({ error: 'Only the bot owner can change status settings' }, { status: 403 });

  try {
    const { type, text } = await req.json();
    const validTypes = ['PLAYING', 'WATCHING', 'LISTENING', 'COMPETING'];
    if (!validTypes.includes(type)) return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    if (!text || typeof text !== 'string' || text.trim().length === 0) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

    const db = getDb();
    await db.collection('botConfig').doc('status').set({
      type,
      text: text.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
