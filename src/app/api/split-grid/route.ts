// برش یک عکس شبکه‌ای (کولاژ چند عکسی) به تصاویر جداگانه
// ورودی: file + cols + rows (+ اختیاری gap برای نادیده‌گرفتن فاصله بین خانه‌ها)
// خروجی: آرایه URL هر خانه، آماده استفاده به‌عنوان عکس مرجع
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { storeImageBuffer } from '@/lib/storage';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const cols = Math.max(1, Math.min(8, Number(form.get('cols') ?? 5)));
  const rows = Math.max(1, Math.min(8, Number(form.get('rows') ?? 3)));
  // درصد بریدن حاشیه هر خانه برای حذف خطوط جداکننده (پیش‌فرض ۱٪)
  const trim = Math.max(0, Math.min(0.15, Number(form.get('trim') ?? 0.01)));

  if (!file) return NextResponse.json({ error: 'فایلی ارسال نشده' }, { status: 400 });

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(input).metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    if (!W || !H) throw new Error('ابعاد تصویر خوانده نشد');

    const cellW = Math.floor(W / cols);
    const cellH = Math.floor(H / rows);
    const insetX = Math.floor(cellW * trim);
    const insetY = Math.floor(cellH * trim);

    const urls: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = c * cellW + insetX;
        const top = r * cellH + insetY;
        const width = cellW - insetX * 2;
        const height = cellH - insetY * 2;
        if (width <= 0 || height <= 0) continue;
        const tile = await sharp(input)
          .extract({ left, top, width, height })
          .jpeg({ quality: 92 })
          .toBuffer();
        urls.push(await storeImageBuffer(tile, 'image/jpeg'));
      }
    }

    return NextResponse.json({ urls, count: urls.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
