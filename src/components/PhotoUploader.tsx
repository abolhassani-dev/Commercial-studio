'use client';
import { useRef, useState } from 'react';

/** آپلودگر عکس مرجع — خروجی: لیست URL (remote اگر fal فعال باشد، وگرنه مسیر محلی) */
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
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
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
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="field">
      <label>{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {busy && <span className="pill warn">در حال آپلود…</span>}
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
    </div>
  );
}
