/** توکن جلسه: هش ساده از رمز + نمک ثابت (کافی برای ابزار شخصی تک‌کاربره) */
export function expectedToken(password: string): string {
  let h = 0x811c9dc5;
  const s = `studio-salt-v1:${password}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0') + s.length.toString(16);
}
