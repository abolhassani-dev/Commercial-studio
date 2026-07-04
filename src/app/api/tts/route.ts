// متن فارسی → صدای طبیعی (ElevenLabs)
import { NextRequest, NextResponse } from 'next/server';
import { callElevenLabs } from '@/lib/providers/elevenlabs';

export async function POST(req: NextRequest) {
  const { text, voiceId } = (await req.json()) as { text: string; voiceId?: string };
  if (!text) return NextResponse.json({ error: 'متن خالی است' }, { status: 400 });
  try {
    const audio = await callElevenLabs(text, voiceId ? { voiceId } : {});
    return new NextResponse(new Uint8Array(audio), {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
