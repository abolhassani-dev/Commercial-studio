// آپلود عکس مرجع (شخص/محصول/لوگو) → ذخیره محلی + آپلود به fal برای دسترسی مدل‌ها
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { newId } from '@/lib/store';
import { uploadToFal } from '@/lib/providers/fal';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'فایلی ارسال نشده' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const name = `${newId()}.${ext}`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  const localPath = `/uploads/${name}`;

  // اگر کلید fal موجود است، همزمان به فضای fal هم آپلود کن تا مدل‌ها URL عمومی داشته باشند
  let remoteUrl: string | null = null;
  if (process.env.FAL_KEY) {
    try {
      remoteUrl = await uploadToFal(buffer, file.type || 'image/jpeg');
    } catch {
      // آپلود remote اختیاری است؛ خطا نده
    }
  }

  return NextResponse.json({ localPath, remoteUrl: remoteUrl ?? localPath });
}
