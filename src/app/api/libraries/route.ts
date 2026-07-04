// ارسال کتابخانه‌ها (صحنه/نور/دوربین/سبک/پلتفرم) به فرم
import { NextResponse } from 'next/server';
import { LIB } from '@/lib/libraries';
import { QC_CHECKS } from '@/lib/qc';

export async function GET() {
  return NextResponse.json({ ...LIB, qcChecks: QC_CHECKS });
}
