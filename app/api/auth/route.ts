import { NextResponse } from 'next/server';
import { getOAuthURL } from '@/lib/auth';

export async function GET() {
  const url = getOAuthURL();
  return NextResponse.redirect(url);
}
