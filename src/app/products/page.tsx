'use client';
import { useEffect, useState } from 'react';
import PhotoUploader from '@/components/PhotoUploader';
import type { Product } from '@/lib/types';

const CATEGORIES = [
  ['motorcycle', 'موتورسیکلت'],
  ['clothing', 'پوشاک'],
  ['bag', 'کیف و اکسسوری'],
  ['cosmetics', 'آرایشی و بهداشتی'],
  ['curtain', 'پرده و منسوجات خانه'],
  ['electronics', 'الکترونیک'],
  ['food', 'خوراکی'],
  ['service', 'خدمات / کسب‌وکار'],
  ['other', 'سایر'],
] as const;

const EMPTY = {
  name: '',
  category: 'other',
  referencePhotos: [] as string[],
  lockedDescription: '',
  keyFeaturesText: '',
  price: '',
  notes: '',
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/db/products').then((r) => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name || !form.lockedDescription) {
      setMsg('نام و توصیف دقیق محصول الزامی است.');
      return;
    }
    const { keyFeaturesText, ...rest } = form;
    await fetch('/api/db/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...rest,
        keyFeatures: keyFeaturesText.split('\n').map((s) => s.trim()).filter(Boolean),
      }),
    });
    setForm(EMPTY);
    setMsg('');
    load();
  }

  return (
    <div>
      <h1>📦 مدیریت محصولات (Product Manager)</h1>
      <p className="sub">
        محصول را یک بار با عکس تمیز و توصیف دقیق ثبت کن؛ سیستم در همه صحنه‌ها همان محصول واقعی را
        بدون تغییر جای‌گذاری می‌کند.
      </p>

      <div className="card">
        <h2>افزودن محصول</h2>
        <div className="grid cols-3">
          <div className="field">
            <label>نام محصول</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>دسته</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>قیمت (اختیاری)</label>
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
        </div>

        <PhotoUploader
          photos={form.referencePhotos}
          onChange={(p) => setForm({ ...form, referencePhotos: p })}
          label="عکس‌های محصول (۳ تا ۶ عکس: روبه‌رو، سه‌رخ، جزئیات لوگو — پس‌زمینه ساده)"
        />

        <div className="field">
          <label>
            توصیف دقیق محصول — به انگلیسی، با ذکر رنگ دقیق، متریال و لوگو. (مثال: a matte black Bajaj
            Boxer 150 motorcycle with red pinstripe on fuel tank, chrome exhaust)
          </label>
          <textarea
            dir="ltr"
            value={form.lockedDescription}
            onChange={(e) => setForm({ ...form, lockedDescription: e.target.value })}
          />
        </div>

        <div className="field">
          <label>ویژگی‌های فروش — فارسی، هر خط یک ویژگی (در سناریو و دیالوگ استفاده می‌شود)</label>
          <textarea
            value={form.keyFeaturesText}
            onChange={(e) => setForm({ ...form, keyFeaturesText: e.target.value })}
            placeholder={'مصرف سوخت کم\nگارانتی ۲ ساله\nطراحی اسپرت'}
          />
        </div>

        {msg && <div className="msg err">{msg}</div>}
        <button onClick={save}>ذخیره محصول</button>
      </div>

      <h2>محصولات ثبت‌شده ({items.length})</h2>
      {items.map((it) => (
        <div className="item-row" key={it.id}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {it.referencePhotos[0] && <img src={it.referencePhotos[0]} className="thumb" alt="" />}
            <div>
              <strong>{it.name}</strong>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {CATEGORIES.find(([v]) => v === it.category)?.[1]} · {it.referencePhotos.length} عکس
              </div>
            </div>
          </div>
          <button
            className="danger"
            onClick={async () => {
              await fetch(`/api/db/products?id=${it.id}`, { method: 'DELETE' });
              load();
            }}
          >
            حذف
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="sub">هنوز محصولی ثبت نشده.</p>}
    </div>
  );
}
