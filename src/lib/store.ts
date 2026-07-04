// ── ذخیره‌سازی دوحالته ───────────────────────────────────────
// لوکال: فایل JSON در data/store (ساده و بدون وابستگی).
// روی Vercel (یا هر سرورلس): Vercel Blob — چون دیسک سرورلس ماندگار نیست.
// انتخاب خودکار است: اگر BLOB_READ_WRITE_TOKEN باشد، Blob استفاده می‌شود.

import { promises as fs } from 'fs';
import path from 'path';

const STORE_DIR = path.join(process.cwd(), 'data', 'store');
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

export const COLLECTIONS = ['identities', 'products', 'brands', 'outputs'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

// ── حالت Blob (ابری) ──
// نکته مهم: Blob فایل‌ها را روی CDN کش می‌کند. چون این‌ها یک دیتابیس متغیرند،
// باید cacheControlMaxAge=0 باشد و موقع خواندن هم کش را دور بزنیم؛ وگرنه
// به‌روزرسانی‌ها دیده نمی‌شوند.
async function blobRead<T>(collection: CollectionName): Promise<T[]> {
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: `store/${collection}.json` });
  const blob = blobs.find((b) => b.pathname === `store/${collection}.json`);
  if (!blob) return [];
  // دور زدن کش CDN با پارامتر ضدکش + no-store
  const bust = `?ts=${Date.now()}`;
  const res = await fetch(blob.url + bust, { cache: 'no-store' });
  if (!res.ok) return [];
  return (await res.json()) as T[];
}

async function blobWrite<T>(collection: CollectionName, items: T[]) {
  const { put } = await import('@vercel/blob');
  await put(`store/${collection}.json`, JSON.stringify(items, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0, // این دیتابیس است — نباید کش شود
  });
}

// ── حالت لوکال (فایل) ──
function fileFor(collection: CollectionName) {
  return path.join(STORE_DIR, `${collection}.json`);
}

async function fileRead<T>(collection: CollectionName): Promise<T[]> {
  try {
    const raw = await fs.readFile(fileFor(collection), 'utf-8');
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function fileWrite<T>(collection: CollectionName, items: T[]) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(fileFor(collection), JSON.stringify(items, null, 2), 'utf-8');
}

// ── API عمومی ──
export async function readCollection<T>(collection: CollectionName): Promise<T[]> {
  return USE_BLOB ? blobRead<T>(collection) : fileRead<T>(collection);
}

async function writeCollection<T>(collection: CollectionName, items: T[]) {
  return USE_BLOB ? blobWrite(collection, items) : fileWrite(collection, items);
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
