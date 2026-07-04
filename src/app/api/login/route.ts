// ورود با رمز عبور → ست شدن کوکی جلسه (۳۰ روز)
import { NextRequest, NextResponse } from 'next/server';
import { expectedToken } from '@/lib/auth';

// جلوگیری از حمله brute-force: حداکثر ۵ تلاش ناموفق در دقیقه
let attempts: { t: number }[] = [];

export async function POST(req: NextRequest) {
  const now = Date.now();
  attempts = attempts.filter((a) => now - a.t < 60_000);
  if (attempts.length >= 5) {
    return NextResponse.json({ error: 'تلاش زیاد — یک دقیقه صبر کن' }, { status: 429 });
  }

  const { password } = (await req.json()) as { password?: string };
  const expected = process.env.APP_PASSWORD;
  if (!expected) return NextResponse.json({ ok: true }); // بدون قفل

  if (password !== expected) {
    attempts.push({ t: now });
    return NextResponse.json({ error: 'رمز اشتباه است' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('studio_auth', expectedToken(expected), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
