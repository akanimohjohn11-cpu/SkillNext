import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { generateId, getStore } from '@/lib/marketplace-store';

export async function GET() {
  const session = await getCurrentSessionUser();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const store = getStore();
  const allReviews = store.providers.flatMap((p) =>
    p.reviews.map((r) => ({
      ...r,
      providerName: p.fullName,
      providerBusiness: p.businessName,
    }))
  );

  return NextResponse.json({
    users: store.users.map((u) => u.user),
    providers: store.providers,
    categories: store.categories,
    verifications: store.verifications,
    reviews: allReviews,
    requests: store.requests,
    inquiriesCount: store.inquiries.length,
    contacts: store.contacts,
  });
}

const adminActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('review_verification'),
    verificationId: z.string().min(1),
    decision: z.enum(['verified', 'rejected']),
    notes: z.string().max(400).optional(),
  }),
  z.object({
    action: z.literal('toggle_user_status'),
    userId: z.string().min(1),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal('create_category'),
    name: z.string().min(2).max(60),
    description: z.string().min(10).max(300),
    iconName: z.string().min(2).max(40).default('Briefcase'),
  }),
  z.object({
    action: z.literal('toggle_category'),
    categoryId: z.string().min(1),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal('moderate_review'),
    providerId: z.string().min(1),
    reviewId: z.string().min(1),
    isHidden: z.boolean(),
  }),
]);

export async function PATCH(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid admin action' },
      { status: 400 }
    );
  }

  const store = getStore();
  const data = parsed.data;

  if (data.action === 'review_verification') {
    const item = store.verifications.find((v) => v.id === data.verificationId);
    if (!item) {
      return NextResponse.json({ error: 'Verification record not found' }, { status: 404 });
    }
    item.status = data.decision;
    item.reviewedNotes = data.notes?.trim() || (data.decision === 'verified' ? 'Identity & credentials verified by SkillNest Trust Team.' : 'Submission requires clearer documentation.');

    const provider = store.providers.find((p) => p.id === item.providerId);
    if (provider) {
      provider.verificationStatus = data.decision;
      provider.verificationNotes = item.reviewedNotes;
      if (data.decision === 'verified') {
        provider.ninVerified = true;
      }
    }
    return NextResponse.json({ ok: true, verification: item });
  }

  if (data.action === 'toggle_user_status') {
    const userRec = store.users.find((u) => u.user.id === data.userId);
    if (!userRec) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    userRec.user.isActive = data.isActive;
    return NextResponse.json({ ok: true, user: userRec.user });
  }

  if (data.action === 'create_category') {
    const slug = data.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (store.categories.some((c) => c.slug === slug)) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    const category = {
      id: generateId('cat'),
      name: data.name.trim(),
      slug,
      description: data.description.trim(),
      iconName: data.iconName,
      providerCount: 0,
      isFeatured: false,
      isActive: true,
    };
    store.categories.push(category);
    return NextResponse.json({ ok: true, category });
  }

  if (data.action === 'toggle_category') {
    const cat = store.categories.find((c) => c.id === data.categoryId);
    if (!cat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    cat.isActive = data.isActive;
    return NextResponse.json({ ok: true, category: cat });
  }

  if (data.action === 'moderate_review') {
    const provider = store.providers.find((p) => p.id === data.providerId);
    const review = provider?.reviews.find((r) => r.id === data.reviewId);
    if (!provider || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    review.isHidden = data.isHidden;
    const visible = provider.reviews.filter((r) => !r.isHidden);
    provider.reviewCount = visible.length;
    provider.ratingAvg =
      visible.length > 0
        ? Number((visible.reduce((s, r) => s + r.rating, 0) / visible.length).toFixed(1))
        : 5.0;
    return NextResponse.json({ ok: true, review });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
