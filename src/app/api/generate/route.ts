// اجرای تولید واقعی: بسته پرامپت → Model Router → مدل → ذخیره خروجی
// نکته: چون Blob دیتابیس تراکنشی نیست، اول تولید می‌کنیم و بعد یک‌بار
// رکورد نهایی را ذخیره می‌کنیم (به‌جای add سپس update که رِیس می‌کرد).
import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@/lib/modelRouter';
import { addItem, newId } from '@/lib/store';
import type { CreationRequest, OutputRecord, PromptPackage } from '@/lib/types';

export const maxDuration = 300; // سقف پلن رایگان Vercel؛ تولید ویدیو ممکن است چند دقیقه طول بکشد

export async function POST(req: NextRequest) {
  const { promptPackage, request, title } = (await req.json()) as {
    promptPackage: PromptPackage;
    request: CreationRequest;
    title?: string;
  };

  const base = {
    id: newId(),
    title: title ?? `${promptPackage.meta.outputType} — ${promptPackage.meta.platform}`,
    request,
    promptPackage,
    createdAt: new Date().toISOString(),
  };

  try {
    const result = await generate(promptPackage);
    const record: OutputRecord = { ...base, resultUrls: result.urls, status: 'done' };
    await addItem<OutputRecord>('outputs', record);
    return NextResponse.json({ ok: true, output: record, model: result.model });
  } catch (err) {
    const record: OutputRecord = { ...base, resultUrls: [], status: 'failed' };
    await addItem<OutputRecord>('outputs', record);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), outputId: record.id },
      { status: 500 },
    );
  }
}
