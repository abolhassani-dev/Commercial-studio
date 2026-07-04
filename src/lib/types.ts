// ── تایپ‌های اصلی سیستم ──────────────────────────────────────

/** هویت یک شخص واقعی — قلب سیستم حفظ هویت */
export interface Identity {
  id: string;
  name: string; // نام نمایشی، مثل «سارا»
  gender: 'male' | 'female' | 'other';
  // عکس‌های مرجع (مسیر فایل در /uploads). حداقل ۵، ایده‌آل ۱۰-۲۰
  referencePhotos: string[];
  // توصیف ثابت ظاهری که در هر پرامپت تکرار می‌شود تا هویت قفل بماند
  lockedDescription: string; // انگلیسی — مثلا "a 32-year-old Iranian woman with..."
  // شناسه LoRA آموزش‌دیده (اگر آموزش داده شده باشد) — قوی‌ترین روش حفظ هویت
  loraUrl?: string;
  triggerWord?: string; // کلمه فعال‌ساز LoRA
  voiceId?: string; // شناسه صدای کلون‌شده در ElevenLabs
  notes?: string;
  createdAt: string;
}

/** محصول — موتورسیکلت، لباس، کیف، لوازم آرایشی و... */
export interface Product {
  id: string;
  name: string;
  category: string; // motorcycle | clothing | bag | cosmetics | curtain | other
  referencePhotos: string[];
  // توصیف دقیق انگلیسی محصول برای حفظ ظاهر آن در تصاویر
  lockedDescription: string;
  keyFeatures: string[]; // ویژگی‌های فروش (فارسی) برای استفاده در سناریو
  price?: string;
  notes?: string;
  createdAt: string;
}

/** برند — رنگ، لوگو، لحن */
export interface Brand {
  id: string;
  name: string;
  logoPath?: string;
  colors: string[]; // hex
  fontNote?: string;
  visualStyle: string; // توصیف سبک بصری (انگلیسی برای پرامپت)
  toneOfVoice: string; // لحن تبلیغاتی فارسی: صمیمی، لوکس، هیجانی...
  tagline?: string;
  businessIntro?: string; // متن معرفی کسب‌وکار
  createdAt: string;
}

/** انتخاب‌های فرم ساخت محتوا */
export interface CreationRequest {
  outputType: 'photo' | 'video' | 'reel' | 'ugc';
  identityId?: string;
  productId?: string;
  brandId?: string;
  sceneId: string;
  styleId: string;
  lightingId: string;
  cameraShotId: string;
  cameraMoveId?: string; // فقط ویدیو
  platformId: string;
  durationS?: number;
  dialogueLanguage?: 'fa' | 'en' | 'none';
  adTone?: string; // لحن: صمیمی، لوکس، هیجانی، اعتمادساز
  cta?: string; // فراخوان اقدام
  extraNotes?: string; // توضیح آزاد کاربر (فارسی یا انگلیسی)
  imageEngine?: string; // موتور تصویر انتخابی (auto | flux-pro | nano-banana | gpt-image | ...)
}

/** پرامپت ساختاریافته JSON — خروجی Prompt Builder */
export interface PromptPackage {
  meta: {
    createdAt: string;
    outputType: CreationRequest['outputType'];
    platform: string;
    aspectRatio: string;
    durationS?: number;
  };
  identity?: {
    name: string;
    lockedDescription: string;
    referencePhotos: string[];
    loraUrl?: string;
    triggerWord?: string;
    preservationRules: string; // قوانین سخت‌گیرانه عدم تغییر چهره/بدن
  };
  product?: {
    name: string;
    lockedDescription: string;
    referencePhotos: string[];
  };
  brand?: { name: string; colors: string[]; visualStyle: string; toneOfVoice: string };
  scene: string;
  style: string;
  lighting: string;
  camera: string;
  /** پرامپت نهایی متنی — آماده paste در هر ابزار */
  finalPrompt: string;
  negativePrompt: string;
  /** سناریو چندصحنه‌ای برای ویدیو */
  scenes?: VideoScene[];
  /** دیالوگ فارسی برای UGC / گفتار */
  dialogue?: { language: string; text: string; voiceDirection: string };
  /** تنظیمات پیشنهادی مدل برای Model Router */
  modelHints: { task: TaskType; params: Record<string, unknown> };
}

export interface VideoScene {
  index: number;
  durationS: number;
  description_fa: string; // توضیح فارسی برای کاربر
  prompt: string; // پرامپت انگلیسی این صحنه
  cameraMove: string;
  dialogue?: string;
}

export type TaskType =
  | 'image' // تولید تصویر
  | 'image-identity' // تصویر با حفظ هویت شخص
  | 'image-edit' // ویرایش/جای‌گذاری محصول
  | 'video' // متن/تصویر به ویدیو
  | 'video-identity' // ویدیو با رفرنس کاراکتر
  | 'lipsync' // لب‌خوانی
  | 'tts' // متن به گفتار فارسی
  | 'upscale' // افزایش کیفیت
  | 'train-lora'; // آموزش هویت

/** خروجی ذخیره‌شده */
export interface OutputRecord {
  id: string;
  title: string;
  request: CreationRequest;
  promptPackage: PromptPackage;
  resultUrls: string[]; // URLهای عکس/ویدیو تولیدشده
  status: 'draft' | 'generating' | 'done' | 'failed';
  qcChecklist?: Record<string, boolean>;
  createdAt: string;
}
