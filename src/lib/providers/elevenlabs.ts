// ── اتصال به ElevenLabs — گفتار فارسی و کلون صدا ─────────────

const BASE = 'https://api.elevenlabs.io/v1';

function xiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error(
      'ELEVENLABS_API_KEY تنظیم نشده. از elevenlabs.io کلید بگیر و در .env.local بگذار.',
    );
  }
  return key;
}

/** متن فارسی → فایل صوتی MP3 (Buffer) */
export async function callElevenLabs(
  text: string,
  {
    voiceId = 'EXAVITQu4vr4xnSDxMaL', // صدای پیش‌فرض؛ بعد از کلون صدا، voiceId شخص را بده
    modelId = 'eleven_v3',
  }: { voiceId?: string; modelId?: string } = {},
): Promise<Buffer> {
  const res = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': xiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs خطا داد (${res.status}): ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}
