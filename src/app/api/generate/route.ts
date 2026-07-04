// اجرای تولید واقعی: بسته پرامپت → Model Router → مدل → ذخیره خروجی
import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@/lib/modelRouter';
import { addItem, newId, updateItem } from '@/lib/store';
import type { CreationRequest, OutputRecord, PromptPackage } from '@/lib/types';

export const maxDuration = 600; // تولید ویدیو ممکن است چند دقیقه طول بکشد

export async function POST(req: NextRequest) {
  const { promptPackage, request, title } = (await req.json()) as {
    promptPackage: PromptPackage;
    request: CreationRequest;
    title?: string;
  };

  const record: OutputRecord = {
    id: newId(),
    title: title ?? `${promptPackage.meta.outputType} — ${promptPackage.meta.platform}`,
    request,
    promptPackage,
    resultUrls: [],
    status: 'generating',
    createdAt: new Date().toISOString(),
  };
  await addItem<OutputRecord>('outputs', record);

  try {
    const result = await generate(promptPackage);
    const updated = await updateItem<OutputRecord>('outputs', record.id, {
      resultUrls: result.urls,
      status: 'done',
    });
    return NextResponse.json({ ok: true, output: updated, model: result.model });
  } catch (err) {
    await updateItem<OutputRecord>('outputs', record.id, { status: 'failed' });
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), outputId: record.id },
      { status: 500 },
    );
  }
}
