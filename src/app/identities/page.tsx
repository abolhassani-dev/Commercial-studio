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

  const load = () => fetch('/api/db/identities').then((r) => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

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
      {items.map((it) => (
        <div className="item-row" key={it.id}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {it.referencePhotos[0] && <img src={it.referencePhotos[0]} className="thumb" alt="" />}
            <div>
              <strong>{it.name}</strong>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {it.referencePhotos.length} عکس مرجع
                {it.loraUrl && <span className="pill ok" style={{ marginInlineStart: 8 }}>LoRA ✓</span>}
                {it.voiceId && <span className="pill ok" style={{ marginInlineStart: 4 }}>صدا ✓</span>}
              </div>
            </div>
          </div>
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
      ))}
      {items.length === 0 && <p className="sub">هنوز شخصی ثبت نشده.</p>}
    </div>
  );
}
