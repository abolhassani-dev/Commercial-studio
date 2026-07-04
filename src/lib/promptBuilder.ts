// ── Prompt Builder ───────────────────────────────────────────
// انتخاب‌های فرم → پرامپت JSON ساختاریافته + پرامپت متنی نهایی.
// مهم‌ترین اصل: «قفل هویت» — توصیف شخص هرگز بازنویسی نمی‌شود و قوانین
// عدم تغییر چهره/بدن به صورت صریح در هر پرامپت تکرار می‌شوند.

import type {
  Brand,
  CreationRequest,
  Identity,
  Product,
  PromptPackage,
  TaskType,
  VideoScene,
} from './types';
import { LIB, findLib } from './libraries';
import { buildUgcScript, buildVideoScenes } from './scriptBuilder';

/** قوانین حفظ هویت — در هر پرامپتی که شخص دارد، عیناً تزریق می‌شود */
export const IDENTITY_PRESERVATION_RULES = `CRITICAL IDENTITY RULES — the person must match the reference photos EXACTLY:
- Face, facial structure, eyes, nose, lips, jawline: identical to reference, zero alteration
- Skin tone and natural skin texture (pores, real texture — never plastic or airbrushed)
- Hair color, hairstyle and natural hairline: unchanged
- Body shape, height, weight, body proportions: unchanged — do NOT slim, do NOT idealize
- Hands and fingers: anatomically correct, natural
- Apparent age and gender: unchanged
Only clothing, pose, location, lighting, camera angle, accessories and background may differ from the reference photos.`;

export const DEFAULT_NEGATIVE = `deformed face, changed face, different person, face swap artifacts, plastic skin, airbrushed skin, extra fingers, missing fingers, deformed hands, warped body, slimmed body, distorted proportions, cross-eyed, asymmetric eyes, bad anatomy, blurry, low quality, watermark, text artifacts, oversaturated, cartoonish, illustration, 3d render look`;

interface BuilderContext {
  request: CreationRequest;
  identity?: Identity | null;
  product?: Product | null;
  brand?: Brand | null;
}

export function buildPromptPackage(ctx: BuilderContext): PromptPackage {
  const { request } = ctx;
  const scene = findLib(LIB.scenes, request.sceneId);
  const style = findLib(LIB.styles, request.styleId);
  const lighting = findLib(LIB.lighting, request.lightingId);
  const shot = findLib(LIB.cameraShots, request.cameraShotId);
  const move = request.cameraMoveId ? findLib(LIB.cameraMoves, request.cameraMoveId) : undefined;
  const platform = LIB.platforms.find((p) => p.id === request.platformId);

  const isVideo = request.outputType !== 'photo';
  const aspectRatio = platform?.aspect_ratio ?? (isVideo ? '9:16' : '4:5');
  const durationS = request.durationS ?? platform?.recommended_duration_s ?? (isVideo ? 10 : undefined);

  // ── سوژه اصلی ──
  const subjectParts: string[] = [];
  if (ctx.identity) {
    const trigger = ctx.identity.triggerWord ? `${ctx.identity.triggerWord}, ` : '';
    subjectParts.push(`${trigger}${ctx.identity.lockedDescription}`);
  }
  if (ctx.product) {
    subjectParts.push(
      ctx.identity
        ? `presenting/using this exact product: ${ctx.product.lockedDescription} (the product must appear EXACTLY as in its reference photos — same shape, colors, logo, materials, no redesign)`
        : `product hero shot of: ${ctx.product.lockedDescription} (the product must appear EXACTLY as in its reference photos — same shape, colors, logo, materials, no redesign)`,
    );
  }
  if (subjectParts.length === 0) subjectParts.push('commercial advertising scene');

  // ── بدنه پرامپت ──
  const body = [
    subjectParts.join('. '),
    `Location: ${scene?.prompt ?? ''}`,
    `Lighting: ${lighting?.prompt ?? ''}`,
    `Camera: ${shot?.prompt ?? ''}${move ? `, ${move.prompt}` : ''}`,
    `Style: ${style?.prompt ?? ''}`,
    ctx.brand?.visualStyle ? `Brand visual language: ${ctx.brand.visualStyle}` : '',
    ctx.brand?.colors?.length ? `Brand color accents: ${ctx.brand.colors.join(', ')}` : '',
    request.extraNotes ? `Additional direction: ${request.extraNotes}` : '',
    `Professional commercial quality, sharp focus on subject, ${aspectRatio} composition.`,
  ]
    .filter(Boolean)
    .join('\n');

  const finalPrompt = ctx.identity ? `${body}\n\n${IDENTITY_PRESERVATION_RULES}` : body;

  // ── سناریو و دیالوگ برای ویدیو ──
  let scenes: VideoScene[] | undefined;
  let dialogue: PromptPackage['dialogue'];
  if (isVideo && durationS) {
    scenes = buildVideoScenes(ctx, { durationS, basePrompt: body, moveprompt: move?.prompt });
    if (request.dialogueLanguage === 'fa') {
      dialogue = buildUgcScript(ctx, durationS);
    }
  }

  // ── انتخاب وظیفه برای Model Router ──
  let task: TaskType = 'image';
  if (!isVideo && ctx.identity) task = 'image-identity';
  if (!isVideo && !ctx.identity && ctx.product?.referencePhotos?.length) task = 'image-edit';
  if (isVideo) task = ctx.identity ? 'video-identity' : 'video';

  return {
    meta: {
      createdAt: new Date().toISOString(),
      outputType: request.outputType,
      platform: platform?.label_fa ?? request.platformId,
      aspectRatio,
      durationS,
    },
    identity: ctx.identity
      ? {
          name: ctx.identity.name,
          lockedDescription: ctx.identity.lockedDescription,
          referencePhotos: ctx.identity.referencePhotos,
          loraUrl: ctx.identity.loraUrl,
          triggerWord: ctx.identity.triggerWord,
          preservationRules: IDENTITY_PRESERVATION_RULES,
        }
      : undefined,
    product: ctx.product
      ? {
          name: ctx.product.name,
          lockedDescription: ctx.product.lockedDescription,
          referencePhotos: ctx.product.referencePhotos,
        }
      : undefined,
    brand: ctx.brand
      ? {
          name: ctx.brand.name,
          colors: ctx.brand.colors,
          visualStyle: ctx.brand.visualStyle,
          toneOfVoice: ctx.brand.toneOfVoice,
        }
      : undefined,
    scene: scene?.prompt ?? '',
    style: style?.prompt ?? '',
    lighting: lighting?.prompt ?? '',
    camera: `${shot?.prompt ?? ''}${move ? `, ${move.prompt}` : ''}`,
    finalPrompt,
    negativePrompt: DEFAULT_NEGATIVE,
    scenes,
    dialogue,
    modelHints: {
      task,
      params: {
        aspect_ratio: aspectRatio,
        duration: durationS,
        num_reference_images: ctx.identity?.referencePhotos?.length ?? 0,
        imageEngine: request.imageEngine ?? 'auto',
      },
    },
  };
}
