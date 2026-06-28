import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'botdash_session';

export interface SessionData {
  discordId: string;
  username: string;
  avatar: string | null;
  guildIds: string[];
}

function getSecret(): string {
  return process.env.SESSION_SECRET || 'fallback-secret-change-me';
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function encodeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function decodeSession(cookie: string): SessionData | null {
  try {
    const dotIndex = cookie.lastIndexOf('.');
    if (dotIndex === -1) return null;
    const payload = cookie.slice(0, dotIndex);
    const sig = cookie.slice(dotIndex + 1);
    const expected = sign(payload);
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionData;
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): SessionData | null {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  return decodeSession(cookie);
}
