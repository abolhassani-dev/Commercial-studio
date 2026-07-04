// ساخت بسته پرامپت از انتخاب‌های فرم (بدون نیاز به هیچ API Key)
import { NextRequest, NextResponse } from 'next/server';
import { buildPromptPackage } from '@/lib/promptBuilder';
import { readCollection } from '@/lib/store';
import type { Brand, CreationRequest, Identity, Product } from '@/lib/types';

export async function POST(req: NextRequest) {
  const request = (await req.json()) as CreationRequest;

  const [identities, products, brands] = await Promise.all([
    readCollection<Identity>('identities'),
    readCollection<Product>('products'),
    readCollection<Brand>('brands'),
  ]);

  const pkg = buildPromptPackage({
    request,
    identity: request.identityId ? identities.find((i) => i.id === request.identityId) : null,
    product: request.productId ? products.find((p) => p.id === request.productId) : null,
    brand: request.brandId ? brands.find((b) => b.id === request.brandId) : null,
  });

  return NextResponse.json(pkg);
}
