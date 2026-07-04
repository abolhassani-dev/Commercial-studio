// ── Script Builder ───────────────────────────────────────────
// ساخت سناریوی چندصحنه‌ای ویدیو + متن UGC فارسی طبیعی.
// نسخه MVP قالب‌محور است؛ اگر ANTHROPIC_API_KEY تنظیم شود، مسیر
// «نویسنده هوشمند» در /api/ai-writer سناریوی سفارشی‌تر تولید می‌کند.

import type { PromptPackage, VideoScene } from './types';

interface Ctx {
  request: { outputType: string; adTone?: string; cta?: string; dialogueLanguage?: string };
  identity?: { name: string; gender?: string } | null;
  product?: { name: string; keyFeatures?: string[]; lockedDescription?: string } | null;
  brand?: { name: string; toneOfVoice?: string; tagline?: string } | null;
}

/** تقسیم مدت ویدیو به صحنه‌های ~۵ ثانیه‌ای با ساختار قلاب → نمایش → CTA */
export function buildVideoScenes(
  ctx: Ctx,
  opts: { durationS: number; basePrompt: string; moveprompt?: string },
): VideoScene[] {
  const sceneCount = Math.max(1, Math.min(6, Math.round(opts.durationS / 5)));
  const per = Math.round(opts.durationS / sceneCount);
  const productName = ctx.product?.name ?? 'محصول';

  const beats: { fa: string; en: string; move: string }[] = [
    {
      fa: `قلاب: نمای گیرا برای جلب توجه در ۳ ثانیه اول`,
      en: `Attention-grabbing opening hook shot. ${opts.basePrompt}. Fast engaging reveal, scroll-stopping first frame`,
      move: 'slow cinematic push-in toward the subject',
    },
    {
      fa: `معرفی: نمایش ${productName} از نمای نزدیک`,
      en: `Detailed close-up beauty shot highlighting product design and materials. ${opts.basePrompt}`,
      move: opts.moveprompt ?? 'smooth orbit around the subject',
    },
    {
      fa: `استفاده واقعی: سوژه در حال استفاده از محصول`,
      en: `Subject naturally using/interacting with the product in the scene. ${opts.basePrompt}. Authentic candid moment`,
      move: 'gimbal tracking shot following the action',
    },
    {
      fa: `جزئیات: نمای ماکرو از کیفیت و بافت`,
      en: `Extreme macro detail shot of textures, materials and craftsmanship. ${opts.basePrompt}`,
      move: 'rack focus across product details',
    },
    {
      fa: `احساس: نمای لایف‌استایل و حس رضایت`,
      en: `Emotional lifestyle moment, subject satisfied and confident. ${opts.basePrompt}`,
      move: 'slow pull-back revealing the full scene',
    },
    {
      fa: `پایان: نمای قهرمانی + جای لوگو و CTA`,
      en: `Final hero shot with clean negative space for logo and call-to-action overlay. ${opts.basePrompt}`,
      move: 'crane shot rising up, subject centered',
    },
  ];

  return beats.slice(0, sceneCount).map((b, i) => ({
    index: i + 1,
    durationS: per,
    description_fa: b.fa,
    prompt: `Scene ${i + 1} of ${sceneCount}: ${b.en}. Camera: ${b.move}.`,
    cameraMove: b.move,
    dialogue: undefined,
  }));
}

/** متن UGC فارسی — طبیعی، محاوره‌ای و قابل باور */
export function buildUgcScript(ctx: Ctx, durationS: number): PromptPackage['dialogue'] {
  const product = ctx.product?.name ?? 'این محصول';
  const features = ctx.product?.keyFeatures?.slice(0, 2) ?? [];
  const tone = ctx.request.adTone ?? ctx.brand?.toneOfVoice ?? 'صمیمی';
  const cta = ctx.request.cta ?? 'لینک توی بیو هست';

  // ~۲.۵ کلمه در ثانیه برای گفتار طبیعی فارسی
  const targetWords = Math.round(durationS * 2.5);

  const hook =
    tone === 'لوکس'
      ? `بالاخره چیزی که دنبالش بودم رو پیدا کردم…`
      : `وایسا! قبل از اینکه رد شی اینو ببین.`;

  const bodyParts = [
    `من چند وقته دارم از ${product} استفاده می‌کنم و واقعاً نظرم عوض شد.`,
    ...features.map((f) => `${f} — اینش برای من خیلی مهم بود.`),
    `اگه دنبال یه انتخاب مطمئن هستی، جدی بهش فکر کن.`,
  ];

  let text = [hook, ...bodyParts, cta].join(' ');
  // برش تقریبی به طول مناسب مدت ویدیو
  const words = text.split(' ');
  if (words.length > targetWords) text = words.slice(0, targetWords).join(' ') + '…';

  return {
    language: 'fa',
    text,
    voiceDirection: `Natural conversational Persian (Farsi), ${
      tone === 'لوکس' ? 'calm confident premium tone' : 'warm friendly energetic tone'
    }, native Tehrani accent, believable UGC delivery — NOT a formal announcer voice`,
  };
}
