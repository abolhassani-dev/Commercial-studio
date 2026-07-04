// ── ذخیره‌سازی فایل‌محور (MVP) ────────────────────────────────
// هر مجموعه (identities, products, brands, outputs) یک فایل JSON در data/store است.
// بعداً بدون تغییر بقیه سیستم می‌توان با SQLite/Postgres جایگزین کرد.

import { promises as fs } from 'fs';
import path from 'path';

const STORE_DIR = path.join(process.cwd(), 'data', 'store');

export const COLLECTIONS = ['identities', 'products', 'brands', 'outputs'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

function fileFor(collection: CollectionName) {
  return path.join(STORE_DIR, `${collection}.json`);
}

export async function readCollection<T>(collection: CollectionName): Promise<T[]> {
  try {
    const raw = await fs.readFile(fileFor(collection), 'utf-8');
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeCollection<T>(collection: CollectionName, items: T[]) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(fileFor(collection), JSON.stringify(items, null, 2), 'utf-8');
}

export async function addItem<T extends { id: string }>(collection: CollectionName, item: T) {
  const items = await readCollection<T>(collection);
  items.unshift(item);
  await writeCollection(collection, items);
  return item;
}

export async function updateItem<T extends { id: string }>(
  collection: CollectionName,
  id: string,
  patch: Partial<T>,
) {
  const items = await readCollection<T>(collection);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch };
  await writeCollection(collection, items);
  return items[idx];
}

export async function deleteItem(collection: CollectionName, id: string) {
  const items = await readCollection<{ id: string }>(collection);
  await writeCollection(collection, items.filter((i) => i.id !== id));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
