'use client';
import { useEffect, useState } from 'react';
import type { OutputRecord } from '@/lib/types';

interface QcCheck { id: string; label_fa: string; appliesTo: string[] }

const STATUS_FA: Record<string, { label: string; cls: string }> = {
  draft: { label: 'پیش‌نویس', cls: '' },
  generating: { label: 'در حال تولید', cls: 'warn' },
  done: { label: 'آماده', cls: 'ok' },
  failed: { label: 'ناموفق', cls: 'fail' },
};

export default function OutputsPage() {
  const [items, setItems] = useState<OutputRecord[]>([]);
  const [qcChecks, setQcChecks] = useState<QcCheck[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const load = () => fetch('/api/db/outputs').then((r) => r.json()).then(setItems);
  useEffect(() => {
    load();
    fetch('/api/libraries').then((r) => r.json()).then((d) => setQcChecks(d.qcChecks ?? []));
  }, []);

  async function toggleQc(item: OutputRecord, checkId: string) {
    const qc = { ...(item.qcChecklist ?? {}), [checkId]: !item.qcChecklist?.[checkId] };
    await fetch('/api/db/outputs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, qcChecklist: qc }),
    });
    load();
  }

  return (
    <div>
      <h1>🗂️ خروجی‌ها (Output Manager)</h1>
      <p className="sub">همه تولیدها با پرامپت، تنظیمات و چک‌لیست کنترل کیفیت — برای بازتولید یا ویرایش.</p>

      {items.length === 0 && <p className="sub">هنوز خروجی‌ای ساخته نشده. از «ساخت محتوا» شروع کن.</p>}

      {items.map((it) => {
        const st = STATUS_FA[it.status] ?? STATUS_FA.draft;
        const checks = qcChecks.filter((c) => c.appliesTo.includes(it.request.outputType));
        const passed = checks.filter((c) => it.qcChecklist?.[c.id]).length;
        return (
          <div className="card" key={it.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <strong>{it.title}</strong>
                <span className={`pill ${st.cls}`} style={{ marginInlineStart: 8 }}>{st.label}</span>
                {checks.length > 0 && it.status === 'done' && (
                  <span className="pill" style={{ marginInlineStart: 4 }}>QC: {passed}/{checks.length}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="secondary" onClick={() => setOpen(open === it.id ? null : it.id)}>
                  {open === it.id ? 'بستن' : 'جزئیات'}
                </button>
                <button
                  className="danger"
                  onClick={async () => {
                    await fetch(`/api/db/outputs?id=${it.id}`, { method: 'DELETE' });
                    load();
                  }}
                >
                  حذف
                </button>
              </div>
            </div>

            {it.resultUrls.map((u) =>
              u.match(/\.(mp4|webm|mov)/i) || it.request.outputType !== 'photo' ? (
                <video key={u} src={u} controls className="result-media" style={{ maxHeight: 360 }} />
              ) : (
                <img key={u} src={u} className="result-media" style={{ maxHeight: 360 }} alt="" />
              ),
            )}

            {open === it.id && (
              <div style={{ marginTop: 12 }}>
                {it.status === 'done' && checks.length > 0 && (
                  <>
                    <h2>✅ چک‌لیست کنترل کیفیت</h2>
                    <div className="checklist">
                      {checks.map((c) => (
                        <label key={c.id}>
                          <input
                            type="checkbox"
                            checked={!!it.qcChecklist?.[c.id]}
                            onChange={() => toggleQc(it, c.id)}
                          />
                          {c.label_fa}
                        </label>
                      ))}
                    </div>
                  </>
                )}
                {it.promptPackage.dialogue && (
                  <>
                    <h2>دیالوگ</h2>
                    <div className="msg info">{it.promptPackage.dialogue.text}</div>
                  </>
                )}
                <h2>بسته پرامپت</h2>
                <pre className="json">{JSON.stringify(it.promptPackage, null, 2)}</pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
