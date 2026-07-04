// CRUD عمومی برای مجموعه‌ها: identities / products / brands / outputs
import { NextRequest, NextResponse } from 'next/server';
import { COLLECTIONS, CollectionName, addItem, deleteItem, newId, readCollection, updateItem } from '@/lib/store';

function valid(collection: string): collection is CollectionName {
  return (COLLECTIONS as readonly string[]).includes(collection);
}

type Params = { params: Promise<{ collection: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { collection } = await params;
  if (!valid(collection)) return NextResponse.json({ error: 'مجموعه نامعتبر' }, { status: 400 });
  return NextResponse.json(await readCollection(collection));
}

export async function POST(req: NextRequest, { params }: Params) {
  const { collection } = await params;
  if (!valid(collection)) return NextResponse.json({ error: 'مجموعه نامعتبر' }, { status: 400 });
  const body = await req.json();
  const item = { createdAt: new Date().toISOString(), ...body, id: body.id ?? newId() };
  if (body.id) {
    const updated = await updateItem(collection, body.id, body);
    if (updated) return NextResponse.json(updated);
  }
  return NextResponse.json(await addItem(collection, item));
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { collection } = await params;
  if (!valid(collection)) return NextResponse.json({ error: 'مجموعه نامعتبر' }, { status: 400 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id لازم است' }, { status: 400 });
  await deleteItem(collection, id);
  return NextResponse.json({ ok: true });
}
