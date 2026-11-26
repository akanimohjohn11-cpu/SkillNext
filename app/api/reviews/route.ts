import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { generateId, getStore } from '@/lib/marketplace-store';
import { reviewCreateSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: 'Please sign in to submit a verified review' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid review submission' },
      { status: 400 }
    );
  }

  const store = getStore();
  const provider = store.providers.find((p) => p.id === parsed.data.providerId);
  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  const review = {
    id: generateId('rev'),
    providerId: provider.id,
    clientId: session.id,
    clientName: session.fullName,
    clientLocation: session.location || 'Lagos',
    rating: parsed.data.rating,
    projectTitle: parsed.data.projectTitle.trim(),
    comment: parsed.data.comment.trim(),
    createdAt: new Date().toISOString(),
  };

  provider.reviews.unshift(review);
  const visible = provider.reviews.filter((r) => !r.isHidden);
  provider.reviewCount = visible.length;
  provider.ratingAvg =
    visible.length > 0
      ? Number(
          (visible.reduce((sum, r) => sum + r.rating, 0) / visible.length).toFixed(1)
        )
      : 5.0;

  return NextResponse.json({ review, provider }, { status: 201 });
}
