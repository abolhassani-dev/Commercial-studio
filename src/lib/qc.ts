// ── Quality Control ──────────────────────────────────────────
// MVP: چک‌لیست انسانی ساختاریافته که در UI روی هر خروجی نمایش داده می‌شود.
// فاز بعد: QC خودکار با مدل Vision (مقایسه چهره خروجی با رفرنس).

export interface QcCheck {
  id: string;
  label_fa: string;
  appliesTo: ('photo' | 'video' | 'reel' | 'ugc')[];
}

export const QC_CHECKS: QcCheck[] = [
  { id: 'face-match', label_fa: 'چهره دقیقاً همان شخص است (چشم، بینی، لب، فک)', appliesTo: ['photo', 'video', 'reel', 'ugc'] },
  { id: 'skin-natural', label_fa: 'پوست طبیعی است، پلاستیکی/بیش‌ازحد صاف نیست', appliesTo: ['photo', 'video', 'reel', 'ugc'] },
  { id: 'body-match', label_fa: 'فرم بدن، قد و تناسب اندام تغییر نکرده', appliesTo: ['photo', 'video', 'reel', 'ugc'] },
  { id: 'hands-ok', label_fa: 'دست‌ها و انگشت‌ها سالم و طبیعی‌اند', appliesTo: ['photo', 'video', 'reel', 'ugc'] },
  { id: 'hair-match', label_fa: 'مو و خط رویش مو همان است', appliesTo: ['photo', 'video', 'reel', 'ugc'] },
  { id: 'product-exact', label_fa: 'محصول دقیقاً همان محصول واقعی است (شکل، رنگ، لوگو)', appliesTo: ['photo', 'video', 'reel', 'ugc'] },
  { id: 'logo-clean', label_fa: 'لوگو و متن‌های داخل تصویر سالم و خوانا هستند', appliesTo: ['photo', 'video', 'reel', 'ugc'] },
  { id: 'lighting-good', label_fa: 'نور و رنگ حرفه‌ای و مطابق سبک انتخابی است', appliesTo: ['photo', 'video', 'reel', 'ugc'] },
  { id: 'motion-smooth', label_fa: 'حرکت روان است، پرش/واپیچش (morphing) ندارد', appliesTo: ['video', 'reel', 'ugc'] },
  { id: 'lipsync-ok', label_fa: 'لب‌ها با صدای فارسی هماهنگ‌اند', appliesTo: ['ugc'] },
  { id: 'voice-natural', label_fa: 'صدا طبیعی و فارسی روان است', appliesTo: ['ugc', 'reel'] },
  { id: 'framing-ok', label_fa: 'کادربندی برای پلتفرم درست است (سوژه وسط کادر عمودی)', appliesTo: ['photo', 'video', 'reel', 'ugc'] },
];

export function checksFor(outputType: 'photo' | 'video' | 'reel' | 'ugc'): QcCheck[] {
  return QC_CHECKS.filter((c) => c.appliesTo.includes(outputType));
}
