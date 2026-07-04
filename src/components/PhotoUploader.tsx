'use client';
import { useRef, useState } from 'react';

/**
 * آپلودگر عکس مرجع با دو حالت:
 *  حالت ۱ (تک‌عکسی): چند عکس جدا آپلود می‌شود.
 *  حالت ۲ (شبکه‌ای): یک عکس کولاژ آپلود می‌شود و سیستم آن را به خانه‌ها برش می‌زند.
 * خروجی هر دو: لیست URL عکس‌های مرجع.
 */
export default function PhotoUploader({
  photos,
  onChange,
  label = 'عکس‌های مرجع',
}: {
  photos: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState('');
  const [gridMode, setGridMode] = useState(false);
  const [cols, setCols] = useState(5);
  const [rows, setRows] = useState(3);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy('در حال آپلود…');
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const { remoteUrl } = await res.json();
        added.push(remoteUrl);
      }
    }
    onChange([...photos, ...added]);
    setBusy('');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleGrid(files: FileList | null) {
    if (!files?.length) return;
    setBusy(`در حال برش به ${cols * rows} عکس…`);
    const fd = new FormData();
    fd.append('file', files[0]);
    fd.append('cols', String(cols));
    fd.append('rows', String(rows));
    const res = await fetch('/api/split-grid', { method: 'POST', body: fd });
    if (res.ok) {
      const { urls } = await res.json();
      onChange([...photos, ...urls]);
    } else {
      const d = await res.json().catch(() => ({}));
      setBusy('');
      alert(d.error ?? 'برش شبکه ناموفق بود');
      return;
    }
    setBusy('');
    if (gridRef.current) gridRef.current.value = '';
  }

  return (
    <div className="field">
      <label>{label}</label>

      {/* سوییچ بین دو حالت */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={gridMode ? 'secondary' : ''}
          style={{ padding: '6px 14px', fontSize: 13 }}
          onClick={() => setGridMode(false)}
        >
          🖼️ چند عکس جدا
        </button>
        <button
          type="button"
          className={gridMode ? '' : 'secondary'}
          style={{ padding: '6px 14px', fontSize: 13 }}
          onClick={() => setGridMode(true)}
        >
          🔳 یک عکس شبکه‌ای (کولاژ)
        </button>
      </div>

      {!gridMode ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={!!busy}
          onChange={(e) => handleFiles(e.target.files)}
        />
      ) : (
        <div style={{ background: 'var(--panel2)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
            یک عکس که چند تصویر در آن کنار هم چیده شده را بده. تعداد ستون و ردیف را مشخص کن تا سیستم آن را
            به عکس‌های جدا برش بزند. (مثال عکس تو: ۵ ستون × ۳ ردیف = ۱۵ عکس)
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ width: 90 }}>
              <label style={{ fontSize: 12 }}>ستون (افقی)</label>
              <input type="number" min={1} max={8} value={cols} onChange={(e) => setCols(Number(e.target.value))} />
            </div>
            <div style={{ width: 90 }}>
              <label style={{ fontSize: 12 }}>ردیف (عمودی)</label>
              <input type="number" min={1} max={8} value={rows} onChange={(e) => setRows(Number(e.target.value))} />
            </div>
            <span className="pill">= {cols * rows} عکس</span>
          </div>
          <input
            ref={gridRef}
            type="file"
            accept="image/*"
            disabled={!!busy}
            onChange={(e) => handleGrid(e.target.files)}
          />
        </div>
      )}

      {busy && <span className="pill warn" style={{ marginTop: 8, display: 'inline-block' }}>{busy}</span>}

      <div className="thumbs">
        {photos.map((p, i) => (
          <img
            key={i}
            src={p}
            className="thumb"
            alt=""
            title="برای حذف کلیک کن"
            style={{ cursor: 'pointer' }}
            onClick={() => onChange(photos.filter((_, j) => j !== i))}
          />
        ))}
      </div>
      {photos.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
          {photos.length} عکس ثبت شد. برای حذف هرکدام رویش کلیک کن.
        </div>
      )}
    </div>
  );
}
