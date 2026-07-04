// آموزش LoRA هویت یک شخص روی fal
//  POST { identityId } → عکس‌های مرجع را zip می‌کند، به fal می‌فرستد، وضعیت را ذخیره می‌کند
//  GET  ?identityId=  → وضعیت آموزش را بررسی می‌کند؛ اگر تمام شده، loraUrl را ذخیره می‌کند
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import modelsConfig from '../../../../config/models.json';
import { readCollection, updateItem } from '@/lib/store';
import { checkFal, getFalResult, submitFal, uploadToFal } from '@/lib/providers/fal';
import type { Identity } from '@/lib/types';

export const maxDuration = 120;

const TRAIN = (modelsConfig.tasks as any)['train-lora'];

/** ساخت کلمه فعال‌ساز یکتا برای هر شخص */
function makeTrigger(name: string, id: string): string {
  return ('P' + id.slice(0, 6)).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function POST(req: NextRequest) {
  const { identityId } = (await req.json()) as { identityId: string };
  const people = await readCollection<Identity>('identities');
  const person = people.find((p) => p.id === identityId);
  if (!person) return NextResponse.json({ error: 'شخص یافت نشد' }, { status: 404 });

  const photos = (person.referencePhotos ?? []).filter((u) => u.startsWith('http'));
  if (photos.length < 5) {
    return NextResponse.json(
      { error: 'برای آموزش LoRA حداقل ۵ عکس مرجع لازم است (ایده‌آل: ۱۰ تا ۱۵).' },
      { status: 400 },
    );
  }

  try {
    // ۱) دانلود عکس‌ها و ساخت zip
    const zip = new JSZip();
    for (let i = 0; i < photos.length; i++) {
      const r = await fetch(photos[i]);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      zip.file(`img_${String(i).padStart(2, '0')}.jpg`, buf);
    }
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });

    // ۲) آپلود zip به فضای fal
    const zipUrl = await uploadToFal(zipBuf, 'application/zip');

    // ۳) ثبت درخواست آموزش (بدون انتظار)
    const trigger = person.triggerWord || makeTrigger(person.name, person.id);
    const submitted = await submitFal(TRAIN.endpoint, {
      images_data_url: zipUrl,
      trigger_word: trigger,
      ...TRAIN.params,
    });

    // ۴) ذخیره وضعیت
    await updateItem<Identity>('identities', identityId, {
      triggerWord: trigger,
      trainingStatus: 'training',
      trainingStatusUrl: submitted.status_url,
      trainingResponseUrl: submitted.response_url,
      trainingError: undefined,
    });

    return NextResponse.json({ ok: true, status: 'training', trigger });
  } catch (err) {
    await updateItem<Identity>('identities', identityId, {
      trainingStatus: 'failed',
      trainingError: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const identityId = req.nextUrl.searchParams.get('identityId');
  if (!identityId) return NextResponse.json({ error: 'identityId لازم است' }, { status: 400 });

  const people = await readCollection<Identity>('identities');
  const person = people.find((p) => p.id === identityId);
  if (!person) return NextResponse.json({ error: 'شخص یافت نشد' }, { status: 404 });

  if (person.trainingStatus !== 'training' || !person.trainingStatusUrl) {
    return NextResponse.json({ status: person.trainingStatus ?? 'idle', loraUrl: person.loraUrl });
  }

  try {
    const st = await checkFal(person.trainingStatusUrl);
    if (st.status === 'COMPLETED') {
      const result = (await getFalResult(person.trainingResponseUrl!)) as any;
      const loraUrl =
        result?.diffusers_lora_file?.url ?? result?.lora_file?.url ?? result?.safetensors?.url;
      if (!loraUrl) throw new Error('فایل LoRA در نتیجه پیدا نشد');
      await updateItem<Identity>('identities', identityId, {
        loraUrl,
        trainingStatus: 'done',
      });
      return NextResponse.json({ status: 'done', loraUrl });
    }
    if (st.status === 'FAILED' || st.error) {
      await updateItem<Identity>('identities', identityId, {
        trainingStatus: 'failed',
        trainingError: JSON.stringify(st.error ?? st),
      });
      return NextResponse.json({ status: 'failed', error: st.error });
    }
    // هنوز در حال آموزش
    return NextResponse.json({ status: 'training', queue: st.status });
  } catch (err) {
    return NextResponse.json(
      { status: 'training', note: err instanceof Error ? err.message : String(err) },
    );
  }
}
