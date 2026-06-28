import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, getDiscordUser, getDiscordUserGuilds } from '@/lib/auth';
import { encodeSession, SESSION_COOKIE } from '@/lib/session';
import { getDb } from '@/lib/firebase';

function getBaseUrl(): string {
  const redirectUri = process.env.DISCORD_REDIRECT_URI!;
  const u = new URL(redirectUri);
  return `${u.protocol}//${u.host}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const base = getBaseUrl();

  if (error || !code) {
    return NextResponse.redirect(`${base}/login?error=access_denied`);
  }

  try {
    const accessToken = await exchangeCode(code);
    const [discordUser, userGuilds] = await Promise.all([
      getDiscordUser(accessToken),
      getDiscordUserGuilds(accessToken),
    ]);

    const db = getDb();
    const botGuildsSnap = await db.collection('guilds').get();
    const botGuildIds = new Set(botGuildsSnap.docs.map((d) => d.id));

    const sharedGuildIds = userGuilds
      .filter((g) => botGuildIds.has(g.id))
      .map((g) => g.id);

    const session = encodeSession({
      discordId: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
      guildIds: sharedGuildIds,
    });

    const res = NextResponse.redirect(`${base}/`);
    res.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${base}/login?error=oauth_failed`);
  }
}
