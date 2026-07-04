'use client';
import { useEffect, useState } from 'react';
import PhotoUploader from '@/components/PhotoUploader';
import type { Identity } from '@/lib/types';

const EMPTY = {
  name: '',
  gender: 'female' as const,
  referencePhotos: [] as string[],
  lockedDescription: '',
  triggerWord: '',
  loraUrl: '',
  voiceId: '',
  notes: '',
};

export default function IdentitiesPage() {
  const [items, setItems] = useState<Identity[]>([]);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [msg, setMsg] = useState('');
  const [training, setTraining] = useState<Record<string, string>>({});

  const load = () => fetch('/api/db/identities').then((r) => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  // بررسی خودکار وضعیت آموزش هر ۳۰ ثانیه برای افرادی که در حال آموزش‌اند
  useEffect(() => {
    const inProgress = items.filter((i) => i.trainingStatus === 'training');
    if (inProgress.length === 0) return;
    const timer = setInterval(async () => {
      for (const p of inProgress) {
        const res = await fetch(`/api/train-lora?identityId=${p.id}`);
        const d = await res.json();
        if (d.status === 'done' || d.status === 'failed') load();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [items]);

  async function startTraining(id: string) {
    setTraining((t) => ({ ...t, [id]: 'شروع آموزش…' }));
    const res = await fetch('/api/train-lora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityId: id }),
    });
    const d = await res.json();
    setTraining((t) => ({ ...t, [id]: '' }));
    if (!d.ok) {
      alert(d.error ?? 'شروع آموزش ناموفق بود');
      return;
    }
    load();
  }

  async function save() {
    if (!form.name || !form.lockedDescription) {
      setMsg('نام و «توصیف قفل‌شده ظاهر» الزامی است.');
      return;
    }
    if (form.referencePhotos.length < 5) {
      setMsg('برای حفظ هویت دقیق، حداقل ۵ عکس مرجع لازم است (ایده‌آل: ۱۰ تا ۱۵).');
      return;
    }
    await fetch('/api/db/identities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm(EMPTY);
    setMsg('');
    load();
  }

  return (
    <div>
      <h1>🧑 مدیریت افراد (Identity Manager)</h1>
      <p className="sub">
        هر شخص واقعی که می‌خواهی از او اینفلوئنسر AI بسازی را اینجا با عکس‌های مرجع ثبت کن. سیستم در
        همه تولیدها چهره و بدن او را عیناً حفظ می‌کند.
      </p>

      <div className="card">
        <h2>افزودن شخص جدید</h2>
        <div className="grid cols-2">
          <div className="field">
            <label>نام (مثلاً: سارا)</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>جنسیت</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
              <option value="female">زن</option>
              <option value="male">مرد</option>
              <option value="other">دیگر</option>
            </select>
          </div>
        </div>

        <PhotoUploader
          photos={form.referencePhotos}
          onChange={(p) => setForm({ ...form, referencePhotos: p })}
          label="عکس‌های مرجع (حداقل ۵ — چهره از روبه‌رو، سه‌رخ چپ و راست، نیم‌تنه، تمام‌قد)"
        />

        <div className="field">
          <label>
            توصیف قفل‌شده ظاهر — به انگلیسی. این متن در تمام پرامپت‌ها عیناً تکرار می‌شود. (مثال: a
            32-year-old Iranian woman, oval face, dark brown eyes, shoulder-length black wavy hair,
            medium build, 168cm)
          </label>
          <textarea
            dir="ltr"
            value={form.lockedDescription}
            onChange={(e) => setForm({ ...form, lockedDescription: e.target.value })}
          />
        </div>

        <details style={{ marginBottom: 14 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}>
            تنظیمات پیشرفته (LoRA و صدا) — اختیاری
          </summary>
          <div className="grid cols-3" style={{ marginTop: 10 }}>
            <div className="field">
              <label>آدرس LoRA آموزش‌دیده (fal)</label>
              <input dir="ltr" value={form.loraUrl} onChange={(e) => setForm({ ...form, loraUrl: e.target.value })} />
            </div>
            <div className="field">
              <label>کلمه فعال‌ساز LoRA</label>
              <input dir="ltr" value={form.triggerWord} onChange={(e) => setForm({ ...form, triggerWord: e.target.value })} />
            </div>
            <div className="field">
              <label>Voice ID کلون‌شده (ElevenLabs)</label>
              <input dir="ltr" value={form.voiceId} onChange={(e) => setForm({ ...form, voiceId: e.target.value })} />
            </div>
          </div>
        </details>

        {msg && <div className="msg err">{msg}</div>}
        <button onClick={save}>ذخیره شخص</button>
      </div>

      <h2>افراد ثبت‌شده ({items.length})</h2>
      {items.map((it) => {
        const st = it.trainingStatus;
        return (
          <div className="item-row" key={it.id} style={{ flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {it.referencePhotos[0] && <img src={it.referencePhotos[0]} className="thumb" alt="" />}
              <div>
                <strong>{it.name}</strong>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {it.referencePhotos.length} عکس مرجع
                  {st === 'done' && <span className="pill ok" style={{ marginInlineStart: 8 }}>هویت آموزش‌دیده ✓</span>}
                  {st === 'training' && <span className="pill warn" style={{ marginInlineStart: 8 }}>⏳ در حال آموزش (~۲۰ دقیقه)</span>}
                  {st === 'failed' && <span className="pill fail" style={{ marginInlineStart: 8 }}>آموزش ناموفق</span>}
                  {it.voiceId && <span className="pill ok" style={{ marginInlineStart: 4 }}>صدا ✓</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {(st === 'idle' || st === undefined || st === 'failed') && (
                <button
                  className="secondary"
                  style={{ fontSize: 13, padding: '7px 14px' }}
                  disabled={!!training[it.id]}
                  onClick={() => startTraining(it.id)}
                  title="یک بار روی عکس‌های این شخص آموزش می‌بیند تا چهره و بدن در همه تولیدها ثابت بماند"
                >
                  {training[it.id] || (st === 'failed' ? '🔁 تلاش دوباره آموزش' : '🧠 آموزش هویت (LoRA)')}
                </button>
              )}
              {st === 'training' && (
                <button className="secondary" style={{ fontSize: 13 }} disabled>
                  در حال آموزش…
                </button>
              )}
              <button
                className="danger"
                onClick={async () => {
                  await fetch(`/api/db/identities?id=${it.id}`, { method: 'DELETE' });
                  load();
                }}
              >
                حذف
              </button>
            </div>
            {st === 'failed' && it.trainingError && (
              <div className="msg err" style={{ width: '100%', fontSize: 12 }}>{it.trainingError}</div>
            )}
          </div>
        );
      })}
      {items.length === 0 && <p className="sub">هنوز شخصی ثبت نشده.</p>}

      <div className="card" style={{ marginTop: 8, background: 'var(--panel2)' }}>
        <strong>🧠 آموزش هویت (LoRA) یعنی چه؟</strong>
        <p className="sub" style={{ marginTop: 6 }}>
          با یک بار زدن دکمه «آموزش هویت»، سیستم حدود ۲۰ دقیقه روی عکس‌های آن شخص آموزش می‌بیند و
          چهره و بدنش را «قفل» می‌کند. بعد از آن، در «ساخت محتوا» با انتخاب همان شخص، چهره و اندام او در
          صدها عکس دقیقاً ثابت می‌ماند — قوی‌ترین حالت حفظ هویت. یک‌بار برای هر نفر کافی است (~۲ تا ۸ سنت).
          می‌توانی صفحه را ببندی؛ آموزش روی سرور ادامه پیدا می‌کند.
        </p>
      </div>
    </div>
  );
}
