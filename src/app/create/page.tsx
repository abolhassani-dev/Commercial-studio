'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Brand, CreationRequest, Identity, Product, PromptPackage } from '@/lib/types';

interface LibItem { id: string; label_fa: string; [k: string]: unknown }
interface Libraries {
  scenes: LibItem[]; lighting: LibItem[]; cameraShots: LibItem[]; cameraMoves: LibItem[];
  styles: LibItem[]; platforms: (LibItem & { type: string; aspect_ratio: string })[];
}

const OUTPUT_TYPES = [
  { id: 'photo', label: '📷 عکس تبلیغاتی' },
  { id: 'reel', label: '🎬 ریلز / تیزر' },
  { id: 'video', label: '🎥 ویدیو معرفی' },
  { id: 'ugc', label: '🤳 ویدیو UGC' },
] as const;

const TONES = ['صمیمی', 'لوکس', 'هیجانی', 'اعتمادساز', 'جوان‌پسند', 'رسمی'];

export default function CreatePage() {
  const [lib, setLib] = useState<Libraries | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [req, setReq] = useState<CreationRequest>({
    outputType: 'photo',
    sceneId: 'studio-white',
    styleId: 'luxury',
    lightingId: 'studio-softbox',
    cameraShotId: 'medium',
    cameraMoveId: 'slow-push',
    platformId: 'instagram-post',
    dialogueLanguage: 'none',
    adTone: 'صمیمی',
    cta: '',
    extraNotes: '',
  });

  const [pkg, setPkg] = useState<PromptPackage | null>(null);
  const [building, setBuilding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ urls: string[]; model: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/libraries').then((r) => r.json()).then(setLib);
    fetch('/api/db/identities').then((r) => r.json()).then(setIdentities);
    fetch('/api/db/products').then((r) => r.json()).then(setProducts);
    fetch('/api/db/brands').then((r) => r.json()).then(setBrands);
  }, []);

  const isVideo = req.outputType !== 'photo';
  const platforms = useMemo(
    () => (lib?.platforms ?? []).filter((p) => (isVideo ? p.type === 'video' : p.type === 'image')),
    [lib, isVideo],
  );

  // وقتی نوع خروجی عوض شد، پلتفرم سازگار انتخاب کن
  useEffect(() => {
    if (platforms.length && !platforms.find((p) => p.id === req.platformId)) {
      setReq((r) => ({ ...r, platformId: platforms[0].id }));
    }
  }, [platforms]); // eslint-disable-line react-hooks/exhaustive-deps

  async function build() {
    setBuilding(true);
    setError('');
    setGenResult(null);
    const body = { ...req, dialogueLanguage: req.outputType === 'ugc' ? 'fa' : req.dialogueLanguage };
    const res = await fetch('/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setPkg(await res.json());
    setBuilding(false);
  }

  async function generateNow() {
    if (!pkg) return;
    setGenerating(true);
    setError('');
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptPackage: pkg, request: req }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!data.ok) {
      setError(data.error ?? 'خطای ناشناخته');
      return;
    }
    setGenResult({ urls: data.output.resultUrls, model: data.model });
  }

  function copy(text: string, tag: string) {
    navigator.clipboard.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(''), 1500);
  }

  if (!lib) return <p className="sub">در حال بارگذاری…</p>;

  const sel = (
    label: string,
    value: string | undefined,
    items: { id: string; label_fa?: string; label?: string }[],
    onChange: (v: string) => void,
    allowNone = false,
  ) => (
    <div className="field">
      <label>{label}</label>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {allowNone && <option value="">— هیچ‌کدام —</option>}
        {items.map((i) => (
          <option key={i.id} value={i.id}>{(i as any).label_fa ?? (i as any).name ?? i.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <h1>✨ ساخت محتوا</h1>
      <p className="sub">انتخاب کن؛ سیستم پرامپت حرفه‌ای، سناریو و تنظیمات مدل را خودش می‌سازد.</p>

      <div className="card">
        <div className="field">
          <label>نوع خروجی</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {OUTPUT_TYPES.map((t) => (
              <button
                key={t.id}
                className={req.outputType === t.id ? '' : 'secondary'}
                onClick={() => setReq({ ...req, outputType: t.id })}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid cols-3">
          {sel('شخص / اینفلوئنسر', req.identityId, identities.map((i) => ({ id: i.id, label_fa: i.name })), (v) => setReq({ ...req, identityId: v || undefined }), true)}
          {sel('محصول', req.productId, products.map((p) => ({ id: p.id, label_fa: p.name })), (v) => setReq({ ...req, productId: v || undefined }), true)}
          {sel('برند', req.brandId, brands.map((b) => ({ id: b.id, label_fa: b.name })), (v) => setReq({ ...req, brandId: v || undefined }), true)}
        </div>

        <div className="grid cols-3">
          {sel('لوکیشن / صحنه', req.sceneId, lib.scenes, (v) => setReq({ ...req, sceneId: v }))}
          {sel('سبک بصری', req.styleId, lib.styles, (v) => setReq({ ...req, styleId: v }))}
          {sel('نورپردازی', req.lightingId, lib.lighting, (v) => setReq({ ...req, lightingId: v }))}
        </div>

        <div className="grid cols-3">
          {sel('نمای دوربین', req.cameraShotId, lib.cameraShots, (v) => setReq({ ...req, cameraShotId: v }))}
          {isVideo && sel('حرکت دوربین', req.cameraMoveId, lib.cameraMoves, (v) => setReq({ ...req, cameraMoveId: v }))}
          {sel('پلتفرم خروجی', req.platformId, platforms, (v) => setReq({ ...req, platformId: v }))}
        </div>

        {isVideo && (
          <div className="grid cols-3">
            <div className="field">
              <label>مدت ویدیو (ثانیه)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={req.durationS ?? 15}
                onChange={(e) => setReq({ ...req, durationS: Number(e.target.value) })}
              />
            </div>
            {sel('لحن تبلیغ', req.adTone, TONES.map((t) => ({ id: t, label_fa: t })), (v) => setReq({ ...req, adTone: v }))}
            <div className="field">
              <label>CTA (فراخوان اقدام)</label>
              <input
                value={req.cta ?? ''}
                placeholder="مثلاً: لینک توی بیو"
                onChange={(e) => setReq({ ...req, cta: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="field">
          <label>توضیح اضافه (اختیاری — فارسی یا انگلیسی)</label>
          <textarea
            value={req.extraNotes ?? ''}
            placeholder="مثلاً: موتور کنار دیوار گرافیتی پارک شده و شخص به آن تکیه داده"
            onChange={(e) => setReq({ ...req, extraNotes: e.target.value })}
          />
        </div>

        <button onClick={build} disabled={building}>
          {building ? 'در حال ساخت…' : '🛠️ ساخت پرامپت و سناریو'}
        </button>
      </div>

      {pkg && (
        <div className="card">
          <h2>بسته پرامپت آماده</h2>
          <p className="sub">
            نسبت تصویر: {pkg.meta.aspectRatio} · پلتفرم: {pkg.meta.platform}
            {pkg.meta.durationS ? ` · مدت: ${pkg.meta.durationS} ثانیه` : ''}
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={generateNow} disabled={generating}>
              {generating ? '⏳ در حال تولید (چند دقیقه صبر کن)…' : '🚀 تولید خروجی واقعی'}
            </button>
            <button className="secondary" onClick={() => copy(pkg.finalPrompt, 'prompt')}>
              {copied === 'prompt' ? '✓ کپی شد' : 'کپی پرامپت متنی'}
            </button>
            <button className="secondary" onClick={() => copy(JSON.stringify(pkg, null, 2), 'json')}>
              {copied === 'json' ? '✓ کپی شد' : 'کپی JSON کامل'}
            </button>
          </div>

          {error && (
            <div className="msg err">
              {error}
              <div style={{ fontSize: 12, marginTop: 6 }}>
                اگر کلید API نداری، از دکمه «کپی پرامپت» استفاده کن و در ابزار دلخواهت paste کن.
              </div>
            </div>
          )}

          {genResult && (
            <div className="msg ok">
              ✓ تولید شد با مدل <code dir="ltr">{genResult.model}</code> — در «خروجی‌ها» هم ذخیره شد.
            </div>
          )}
          {genResult?.urls.map((u) =>
            u.match(/\.(mp4|webm|mov)/i) || isVideo ? (
              <video key={u} src={u} controls className="result-media" />
            ) : (
              <img key={u} src={u} className="result-media" alt="خروجی" />
            ),
          )}

          {pkg.dialogue && (
            <>
              <h2>🎙️ دیالوگ فارسی</h2>
              <div className="msg info">{pkg.dialogue.text}</div>
            </>
          )}

          {pkg.scenes && pkg.scenes.length > 0 && (
            <>
              <h2>🎬 سناریوی صحنه‌به‌صحنه</h2>
              {pkg.scenes.map((s) => (
                <div key={s.index} className="item-row" style={{ alignItems: 'flex-start', flexDirection: 'column' }}>
                  <strong>
                    صحنه {s.index} ({s.durationS} ثانیه): {s.description_fa}
                  </strong>
                  <div dir="ltr" style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'left' }}>{s.prompt}</div>
                </div>
              ))}
            </>
          )}

          <h2>پرامپت نهایی</h2>
          <pre className="json">{pkg.finalPrompt}</pre>
          <h2>JSON ساختاریافته (قابل ویرایش در خروجی‌ها)</h2>
          <pre className="json">{JSON.stringify(pkg, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
