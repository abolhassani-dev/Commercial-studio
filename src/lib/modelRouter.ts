// ── Model Router ─────────────────────────────────────────────
// تصمیم می‌گیرد هر وظیفه با کدام مدل/ارائه‌دهنده اجرا شود.
// نگاشت وظیفه→مدل در config/models.json است؛ تعویض مدل = ویرایش همان فایل.

import modelsConfig from '../../config/models.json';
import type { PromptPackage, TaskType } from './types';
import { callFal } from './providers/fal';
import { callElevenLabs } from './providers/elevenlabs';

export interface ModelConfig {
  provider: string;
  endpoint: string;
  label: string;
  params: Record<string, unknown>;
  notes?: string;
}

export function resolveModel(task: TaskType | 'image-identity-lora'): ModelConfig {
  const cfg = (modelsConfig.tasks as Record<string, ModelConfig>)[task];
  if (!cfg) throw new Error(`مدلی برای وظیفه «${task}» در config/models.json تعریف نشده`);
  return cfg;
}

export interface GenerateResult {
  urls: string[];
  raw?: unknown;
  model: string;
}

/** اجرای تولید بر اساس بسته پرامپت — نقطه ورود اصلی */
export async function generate(pkg: PromptPackage): Promise<GenerateResult> {
  let task: TaskType | 'image-identity-lora' = pkg.modelHints.task;

  // اگر شخص LoRA آموزش‌دیده دارد، از مسیر قوی‌تر LoRA استفاده کن
  if (task === 'image-identity' && pkg.identity?.loraUrl) task = 'image-identity-lora';

  const model = resolveModel(task);

  if (model.provider === 'fal') {
    const input = buildFalInput(task, model, pkg);
    const result = await callFal(model.endpoint, input);
    return { urls: extractUrls(result), raw: result, model: model.endpoint };
  }

  if (model.provider === 'elevenlabs') {
    throw new Error('برای گفتار از مسیر /api/tts استفاده کن');
  }

  throw new Error(`ارائه‌دهنده ناشناخته: ${model.provider}`);
}

/** ساخت ورودی مخصوص هر خانواده مدل روی fal */
function buildFalInput(
  task: string,
  model: ModelConfig,
  pkg: PromptPackage,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    ...model.params,
    prompt: pkg.finalPrompt,
  };

  const refImages = [
    ...(pkg.identity?.referencePhotos ?? []),
    ...(pkg.product?.referencePhotos ?? []),
  ].filter((u) => u.startsWith('http'));

  switch (task) {
    case 'image':
      return { ...base, aspect_ratio: pkg.meta.aspectRatio, negative_prompt: pkg.negativePrompt };
    case 'image-identity':
    case 'image-edit':
      // مدل‌های خانواده nano-banana رفرنس چندتایی می‌گیرند
      return { ...base, image_urls: refImages.slice(0, 6), aspect_ratio: pkg.meta.aspectRatio };
    case 'image-identity-lora':
      return {
        ...base,
        loras: [{ path: pkg.identity!.loraUrl, scale: 1 }],
        image_size: pkg.meta.aspectRatio === '9:16' ? 'portrait_16_9' : 'square_hd',
        negative_prompt: pkg.negativePrompt,
      };
    case 'video':
      return { ...base, duration: String(Math.min(10, pkg.meta.durationS ?? 5)) };
    case 'video-identity':
      return { ...base, reference_image_urls: refImages.slice(0, 3), aspect_ratio: pkg.meta.aspectRatio };
    default:
      return base;
  }
}

function extractUrls(result: unknown): string[] {
  const r = result as Record<string, any>;
  const urls: string[] = [];
  const push = (v: any) => {
    if (typeof v?.url === 'string') urls.push(v.url);
  };
  if (Array.isArray(r?.images)) r.images.forEach(push);
  push(r?.image);
  push(r?.video);
  if (typeof r?.video_url === 'string') urls.push(r.video_url);
  if (Array.isArray(r?.videos)) r.videos.forEach(push);
  return urls;
}

export { callElevenLabs };
