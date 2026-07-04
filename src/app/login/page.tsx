'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      window.location.href = '/';
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? 'خطا در ورود');
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '15vh' }}>
      <form className="card" style={{ width: 360 }} onSubmit={login}>
        <h1 style={{ textAlign: 'center' }}>🎬 استودیو AI</h1>
        <p className="sub" style={{ textAlign: 'center' }}>این استودیو خصوصی است — رمز عبور را وارد کن.</p>
        <div className="field">
          <label>رمز عبور</label>
          <input
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {err && <div className="msg err">{err}</div>}
        <button disabled={busy} style={{ width: '100%' }}>
          {busy ? '…' : 'ورود'}
        </button>
      </form>
    </div>
  );
}
