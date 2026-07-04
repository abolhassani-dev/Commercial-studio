// ── اتصال به fal.ai ──────────────────────────────────────────
// از REST API صف fal استفاده می‌کند (بدون SDK — بدون وابستگی اضافه).
// هر مدل روی fal با همین دو تابع کار می‌کند.

const FAL_QUEUE = 'https://queue.fal.run';

function falKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error(
      'FAL_KEY تنظیم نشده. فایل .env.local را بساز و کلیدت را از fal.ai/dashboard/keys داخلش بگذار. (بدون کلید، سیستم فقط «بسته پرامپت» می‌سازد)',
    );
  }
  return key;
}

/** فراخوانی مدل روی fal و انتظار تا آماده شدن نتیجه */
export async function callFal(
  endpoint: string,
  input: Record<string, unknown>,
  { timeoutMs = 15 * 60 * 1000 }: { timeoutMs?: number } = {},
): Promise<unknown> {
  const key = falKey();
  const headers = { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };

  // ۱) ثبت درخواست در صف
  const submit = await fetch(`${FAL_QUEUE}/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!submit.ok) {
    throw new Error(`fal.ai خطا داد (${submit.status}): ${await submit.text()}`);
  }
  const { status_url, response_url } = (await submit.json()) as {
    status_url: string;
    response_url: string;
  };

  // ۲) انتظار برای تکمیل
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const st = await fetch(status_url, { headers });
    const status = (await st.json()) as { status: string; error?: unknown };
    if (status.status === 'COMPLETED') {
      const res = await fetch(response_url, { headers });
      return res.json();
    }
    if (status.status === 'FAILED' || status.error) {
      throw new Error(`تولید در fal.ai شکست خورد: ${JSON.stringify(status.error ?? status)}`);
    }
  }
  throw new Error('زمان انتظار تولید تمام شد (timeout)');
}

/** آپلود فایل محلی به فضای ذخیره fal تا مدل‌ها به آن URL دسترسی داشته باشند */
export async function uploadToFal(buffer: Buffer, contentType: string): Promise<string> {
  const key = falKey();
  const init = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content_type: contentType, file_name: `upload-${Date.now()}` }),
  });
  if (!init.ok) throw new Error(`آپلود به fal شکست خورد: ${await init.text()}`);
  const { upload_url, file_url } = (await init.json()) as { upload_url: string; file_url: string };
  const put = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: new Uint8Array(buffer),
  });
  if (!put.ok) throw new Error('آپلود فایل به فضای fal ناموفق بود');
  return file_url;
}
