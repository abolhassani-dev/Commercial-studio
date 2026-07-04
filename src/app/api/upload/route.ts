// آپلود عکس مرجع (شخص/محصول/لوگو)
import { NextRequest, NextResponse } from 'next/server';
import { storeImageBuffer } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'فایلی ارسال نشده' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const url = await storeImageBuffer(buffer, file.type || 'image/jpeg');
    return NextResponse.json({ localPath: url, remoteUrl: url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
