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
    const snap = await db.collection('announcements')
      .where('guildId', 'in', session.guildIds.length > 0 ? session.guildIds : ['__none__'])
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    const announcements = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ announcements });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { guildId, guildName, channelId, channelName, header, content, imageUrl, sender } = body;

    if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
    if (!session.guildIds.includes(guildId)) return NextResponse.json({ error: 'Access denied to this server' }, { status: 403 });
    if (!header?.trim()) return NextResponse.json({ error: 'header is required' }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: 'content is required' }, { status: 400 });

    if (imageUrl && !imageUrl.startsWith('http') && imageUrl.length > 900_000) {
      return NextResponse.json({ error: 'Image too large. Please use a smaller image.' }, { status: 400 });
    }

    const db = getDb();
    const ref = await db.collection('announcements').add({
      guildId,
      guildName: guildName || '',
      channelId: channelId || null,
      channelName: channelName || null,
      header: header.trim(),
      content: content.trim(),
      imageUrl: imageUrl || null,
      sender: sender?.trim() || null,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: ref.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
