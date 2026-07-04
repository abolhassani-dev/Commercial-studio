// آپلود عکس مرجع (شخص/محصول/لوگو)
// اولویت مقصد: فضای fal (مدل‌ها URL عمومی لازم دارند) → Vercel Blob → دیسک محلی
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { newId } from '@/lib/store';
import { uploadToFal } from '@/lib/providers/fal';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ON_SERVERLESS = !!process.env.VERCEL;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'فایلی ارسال نشده' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const name = `${newId()}.${ext}`;
  const contentType = file.type || 'image/jpeg';

  // ۱) fal storage — بهترین گزینه چون مدل‌ها همین URL را مصرف می‌کنند
  if (process.env.FAL_KEY) {
    try {
      const remoteUrl = await uploadToFal(buffer, contentType);
      return NextResponse.json({ localPath: remoteUrl, remoteUrl });
    } catch {
      // برو سراغ گزینه بعدی
    }
  }

  // ۲) Vercel Blob — وقتی در ابر هستیم
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${name}`, buffer, { access: 'public', contentType });
    return NextResponse.json({ localPath: blob.url, remoteUrl: blob.url });
  }

  // ۳) دیسک محلی — حالت اجرای روی کامپیوتر شخصی
  if (!ON_SERVERLESS) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
    return NextResponse.json({ localPath: `/uploads/${name}`, remoteUrl: `/uploads/${name}` });
  }

  return NextResponse.json(
    { error: 'هیچ مقصد آپلودی در دسترس نیست — FAL_KEY یا Vercel Blob را تنظیم کن' },
    { status: 500 },
  );
}
