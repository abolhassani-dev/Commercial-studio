// ── اتصال به OpenAI — تولید و ویرایش تصویر (GPT Image) ────────
// مدل‌های gpt-image خروجی را به‌صورت base64 می‌دهند؛ اینجا آن را به
// فضای ذخیره (fal یا Blob) آپلود می‌کنیم تا مثل بقیه مدل‌ها URL برگردد.

import { uploadToFal } from './fal';

const BASE = 'https://api.openai.com/v1';

function openaiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY تنظیم نشده. کلید را در .env.local یا تنظیمات سرور بگذار.');
  }
  return key;
}

/** نگاشت نسبت تصویر ما به اندازه‌های مجاز gpt-image */
function sizeFor(aspectRatio: string): string {
  if (aspectRatio === '9:16' || aspectRatio === '4:5') return '1024x1536'; // عمودی
  if (aspectRatio === '16:9') return '1536x1024'; // افقی
  return '1024x1024'; // مربع
}

async function b64ToUrl(b64: string): Promise<string> {
  const buffer = Buffer.from(b64, 'base64');
  // اولویت با fal storage؛ اگر نبود، Blob
  if (process.env.FAL_KEY) {
    try {
      return await uploadToFal(buffer, 'image/png');
    } catch {
      /* برو سراغ Blob */
    }
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`outputs/gpt-${Date.now()}.png`, buffer, {
      access: 'public',
      contentType: 'image/png',
    });
    return blob.url;
  }
  // آخرین راه: data URL (برای اجرای کاملاً محلی)
  return `data:image/png;base64,${b64}`;
}

/** تولید تصویر با GPT Image */
export async function callOpenAIImage(
  endpoint: string,
  input: { prompt: string; aspect_ratio?: string; num_images?: number },
): Promise<{ images: { url: string }[] }> {
  const res = await fetch(`${BASE}/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: endpoint,
      prompt: input.prompt,
      size: sizeFor(input.aspect_ratio ?? '1:1'),
      n: input.num_images ?? 1,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI خطا داد (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { data: { b64_json?: string; url?: string }[] };

  const images: { url: string }[] = [];
  for (const item of data.data ?? []) {
    if (item.b64_json) images.push({ url: await b64ToUrl(item.b64_json) });
    else if (item.url) images.push({ url: item.url });
  }
  return { images };
}

/** ویرایش تصویر با رفرنس (جای‌گذاری محصول / حفظ هویت) با GPT Image */
export async function callOpenAIEdit(
  endpoint: string,
  input: { prompt: string; aspect_ratio?: string; image_urls: string[] },
): Promise<{ images: { url: string }[] }> {
  const form = new FormData();
  form.append('model', endpoint);
  form.append('prompt', input.prompt);
  form.append('size', sizeFor(input.aspect_ratio ?? '1:1'));
  // دانلود رفرنس‌ها و افزودن به فرم
  for (let i = 0; i < Math.min(4, input.image_urls.length); i++) {
    const r = await fetch(input.image_urls[i]);
    const blob = await r.blob();
    form.append('image[]', blob, `ref-${i}.png`);
  }
  const res = await fetch(`${BASE}/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`OpenAI edit خطا داد (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { data: { b64_json?: string; url?: string }[] };
  const images: { url: string }[] = [];
  for (const item of data.data ?? []) {
    if (item.b64_json) images.push({ url: await b64ToUrl(item.b64_json) });
    else if (item.url) images.push({ url: item.url });
  }
  return { images };
}
