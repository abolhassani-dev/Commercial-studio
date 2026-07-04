// ارسال کتابخانه‌ها (صحنه/نور/دوربین/سبک/پلتفرم) به فرم
import { NextResponse } from 'next/server';
import { LIB } from '@/lib/libraries';
import { QC_CHECKS } from '@/lib/qc';
import { IMAGE_ENGINES } from '@/lib/modelRouter';

export async function GET() {
  // موتورهای تصویر برای فرم (id + برچسب فارسی)
  const imageEngines = Object.entries(IMAGE_ENGINES ?? {})
    .filter(([id]) => id !== '_comment')
    .map(([id, e]) => ({ id, label_fa: (e as any).label_fa }));
  return NextResponse.json({ ...LIB, qcChecks: QC_CHECKS, imageEngines });
}
