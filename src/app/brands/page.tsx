'use client';
import { useEffect, useState } from 'react';
import PhotoUploader from '@/components/PhotoUploader';
import type { Brand } from '@/lib/types';

const EMPTY = {
  name: '',
  logoPath: '',
  colorsText: '#f0b429, #0d0f14',
  fontNote: '',
  visualStyle: '',
  toneOfVoice: 'صمیمی',
  tagline: '',
  businessIntro: '',
};

export default function BrandsPage() {
  const [items, setItems] = useState<Brand[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/db/brands').then((r) => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name) { setMsg('نام برند الزامی است.'); return; }
    const { colorsText, ...rest } = form;
    await fetch('/api/db/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...rest,
        colors: colorsText.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    setForm(EMPTY);
    setMsg('');
    load();
  }

  return (
    <div>
      <h1>🎨 مدیریت برند (Brand Manager)</h1>
      <p className="sub">هویت بصری و لحن برندت را یک بار تعریف کن تا همه خروجی‌ها یکدست شوند.</p>

      <div className="card">
        <h2>افزودن برند</h2>
        <div className="grid cols-2">
          <div className="field">
            <label>نام برند</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>شعار (اختیاری)</label>
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </div>
        </div>

        <PhotoUploader
          photos={form.logoPath ? [form.logoPath] : []}
          onChange={(p) => setForm({ ...form, logoPath: p[p.length - 1] ?? '' })}
          label="لوگو (PNG با پس‌زمینه شفاف بهتر است)"
        />

        <div className="grid cols-2">
          <div className="field">
            <label>رنگ‌های برند (hex، با کاما جدا کن)</label>
            <input dir="ltr" value={form.colorsText} onChange={(e) => setForm({ ...form, colorsText: e.target.value })} />
          </div>
          <div className="field">
            <label>لحن تبلیغاتی</label>
            <select value={form.toneOfVoice} onChange={(e) => setForm({ ...form, toneOfVoice: e.target.value })}>
              <option>صمیمی</option>
              <option>لوکس</option>
              <option>هیجانی</option>
              <option>اعتمادساز</option>
              <option>جوان‌پسند</option>
              <option>رسمی</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>سبک بصری برند — به انگلیسی (مثال: modern minimal, bold typography, dark backgrounds with gold accents)</label>
          <textarea dir="ltr" value={form.visualStyle} onChange={(e) => setForm({ ...form, visualStyle: e.target.value })} />
        </div>

        <div className="field">
          <label>متن معرفی کسب‌وکار — فارسی (در ویدیوهای معرفی استفاده می‌شود)</label>
          <textarea value={form.businessIntro} onChange={(e) => setForm({ ...form, businessIntro: e.target.value })} />
        </div>

        {msg && <div className="msg err">{msg}</div>}
        <button onClick={save}>ذخیره برند</button>
      </div>

      <h2>برندهای ثبت‌شده ({items.length})</h2>
      {items.map((it) => (
        <div className="item-row" key={it.id}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {it.logoPath && <img src={it.logoPath} className="thumb" alt="" />}
            <div>
              <strong>{it.name}</strong>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {it.colors?.map((c) => (
                  <span key={c} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: '1px solid var(--border)' }} />
                ))}
                <span className="pill" style={{ marginInlineStart: 6 }}>{it.toneOfVoice}</span>
              </div>
            </div>
          </div>
          <button
            className="danger"
            onClick={async () => {
              await fetch(`/api/db/brands?id=${it.id}`, { method: 'DELETE' });
              load();
            }}
          >
            حذف
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="sub">هنوز برندی ثبت نشده.</p>}
    </div>
  );
}
