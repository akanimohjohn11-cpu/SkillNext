import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { getStore } from '@/lib/marketplace-store';

export async function GET(req: NextRequest) {
  const store = getStore();
  const session = await getCurrentSessionUser();
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const category = (searchParams.get('category') || '').trim().toLowerCase();
  const location = (searchParams.get('location') || '').trim().toLowerCase();
  const minRating = Number(searchParams.get('minRating') || '0');
  const maxPrice = Number(searchParams.get('maxPrice') || '0');
  const verifiedOnly = searchParams.get('verified') === 'true';
  const sort = searchParams.get('sort') || 'featured';

  let list = store.providers.filter((p) => {
    if (category && category !== 'all' && p.categorySlug !== category) return false;
    if (location && location !== 'all lagos & nigeria' && !p.location.toLowerCase().includes(location) && !p.serviceAreas.some((a) => a.toLowerCase().includes(location))) {
      return false;
    }
    if (minRating > 0 && p.ratingAvg < minRating) return false;
    if (maxPrice > 0 && p.startingPriceNgn > maxPrice) return false;
    if (verifiedOnly && p.verificationStatus !== 'verified') return false;
    if (q) {
      const haystack = [
        p.fullName,
        p.businessName,
        p.headline,
        p.bio,
        p.categoryName,
        p.location,
        ...p.skills,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  if (sort === 'rating') {
    list = [...list].sort((a, b) => b.ratingAvg - a.ratingAvg);
  } else if (sort === 'price_asc') {
    list = [...list].sort((a, b) => a.startingPriceNgn - b.startingPriceNgn);
  } else if (sort === 'price_desc') {
    list = [...list].sort((a, b) => b.startingPriceNgn - a.startingPriceNgn);
  } else {
    list = [...list].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.ratingAvg - a.ratingAvg);
  }

  const savedIds = session ? store.savedProviders[session.id] || [] : [];

  return NextResponse.json({
    providers: list,
    categories: store.categories.filter((c) => c.isActive),
    savedProviderIds: savedIds,
  });
}

const toggleSaveSchema = z.object({
  providerId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Please sign in to save providers' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = toggleSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 });
  }

  const store = getStore();
  const exists = store.providers.some((p) => p.id === parsed.data.providerId);
  if (!exists) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  const current = store.savedProviders[session.id] || [];
  const isSaved = current.includes(parsed.data.providerId);
  const updated = isSaved
    ? current.filter((id) => id !== parsed.data.providerId)
    : [...current, parsed.data.providerId];
  store.savedProviders[session.id] = updated;

  return NextResponse.json({ saved: !isSaved, savedProviderIds: updated });
}
