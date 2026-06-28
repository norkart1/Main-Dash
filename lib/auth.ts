export const DISCORD_API = 'https://discord.com/api/v10';

export function getOAuthURL(): string {
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const redirectUri = process.env.DISCORD_REDIRECT_URI!;
  const scopes = ['identify', 'guilds'].join('%20');
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}`;
}

export async function exchangeCode(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI!,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!res.ok) throw new Error('Failed to exchange OAuth code');
  const data = await res.json();
  return data.access_token as string;
}

export async function getDiscordUser(accessToken: string): Promise<{ id: string; username: string; discriminator: string; avatar: string | null }> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Discord user');
  return res.json();
}

export async function getDiscordUserGuilds(accessToken: string): Promise<Array<{ id: string; name: string; owner: boolean; permissions: string }>> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user guilds');
  return res.json();
}
