import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { fetchProviderById } from '@/lib/marketplace-data';
import { generateId, getStore } from '@/lib/marketplace-store';
import { isUuid } from '@/lib/supabase/config';
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
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

  if (
    isSupabaseServerConfigured() &&
    isUuid(session.id) &&
    isUuid(parsed.data.providerId)
  ) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: inserted, error } = await supabase
        .from('reviews')
        .insert({
          provider_id: parsed.data.providerId,
          client_id: session.id,
          rating: parsed.data.rating,
          project_title: parsed.data.projectTitle.trim(),
          comment: parsed.data.comment.trim(),
        })
        .select('id, provider_id, client_id, rating, project_title, comment, created_at')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const provider = await fetchProviderById(parsed.data.providerId);
      return NextResponse.json(
        {
          review: {
            id: String(inserted.id),
            providerId: String(inserted.provider_id),
            clientId: String(inserted.client_id),
            clientName: session.fullName,
            clientLocation: session.location || 'Lagos',
            rating: Number(inserted.rating),
            projectTitle: String(inserted.project_title),
            comment: String(inserted.comment),
            createdAt: String(inserted.created_at),
          },
          provider,
        },
        { status: 201 }
      );
    }
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
