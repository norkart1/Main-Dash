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
    if (!snap.exists) return NextResponse.json({ avatar: null, banner: null });
    const data = snap.data()!;
    return NextResponse.json({
      avatarUpdatedAt: data.avatarUpdatedAt?.toDate?.()?.toISOString() || null,
      bannerUpdatedAt: data.bannerUpdatedAt?.toDate?.()?.toISOString() || null,
      hasAvatar: !!data.avatar,
      hasBanner: !!data.banner,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ownerId = process.env.BOT_OWNER_ID;
  if (ownerId && session.discordId !== ownerId) return NextResponse.json({ error: 'Only the bot owner can change profile settings' }, { status: 403 });

  try {
    const { type, dataUrl } = await req.json();

    if (!['avatar', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'type must be avatar or banner' }, { status: 400 });
    }
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }
    if (dataUrl.length > 900_000) {
      return NextResponse.json({ error: 'Image too large. Please use a smaller image.' }, { status: 400 });
    }

    const db = getDb();
    await db.collection('botConfig').doc('profile').set(
      {
        [type]: dataUrl,
        [`${type}UpdatedAt`]: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
