// ── محافظ رمز عبور ───────────────────────────────────────────
// اگر APP_PASSWORD تنظیم شده باشد، همه صفحات و APIها پشت صفحه ورود قفل می‌شوند.
// رمز در کد نیست — فقط در متغیر محیطی سرور.

import { NextRequest, NextResponse } from 'next/server';
import { expectedToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/login'];

export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next(); // بدون رمز = حالت لوکال آزاد

  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookie = req.cookies.get('studio_auth')?.value;
  if (cookie && cookie === expectedToken(password)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'ابتدا وارد شو' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
};
