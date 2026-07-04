// ── ذخیره‌سازی تصویر آپلودی ──────────────────────────────────
// اولویت مقصد: فضای fal (مدل‌ها URL عمومی لازم دارند) → Vercel Blob → دیسک محلی
import { promises as fs } from 'fs';
import path from 'path';
import { newId } from './store';
import { uploadToFal } from './providers/fal';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ON_SERVERLESS = !!process.env.VERCEL;

/** یک بافر تصویر را ذخیره می‌کند و URL قابل دسترس برمی‌گرداند */
export async function storeImageBuffer(buffer: Buffer, contentType = 'image/jpeg'): Promise<string> {
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const name = `${newId()}.${ext}`;

  // ۱) fal storage — بهترین گزینه چون مدل‌ها همین URL را مصرف می‌کنند
  if (process.env.FAL_KEY) {
    try {
      return await uploadToFal(buffer, contentType);
    } catch {
      /* برو سراغ گزینه بعدی */
    }
  }

  // ۲) Vercel Blob — وقتی در ابر هستیم
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${name}`, buffer, { access: 'public', contentType });
    return blob.url;
  }

  // ۳) دیسک محلی — حالت اجرای روی کامپیوتر شخصی
  if (!ON_SERVERLESS) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
    return `/uploads/${name}`;
  }

  throw new Error('هیچ مقصد آپلودی در دسترس نیست — FAL_KEY یا Vercel Blob را تنظیم کن');
}
