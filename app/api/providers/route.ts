import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import {
  fetchCategories,
  fetchProviders,
  fetchSavedProviderIds,
} from '@/lib/marketplace-data';
import { getStore } from '@/lib/marketplace-store';
import { isUuid } from '@/lib/supabase/config';
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const session = await getCurrentSessionUser();
  const { searchParams } = new URL(req.url);

  const filters = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    minRating: Number(searchParams.get('minRating') || '0'),
    maxPrice: Number(searchParams.get('maxPrice') || '0'),
    verifiedOnly: searchParams.get('verified') === 'true',
    sort: searchParams.get('sort') || 'featured',
  };

  const [providers, categories, savedProviderIds] = await Promise.all([
    fetchProviders(filters),
    fetchCategories(),
    fetchSavedProviderIds(session?.id),
  ]);

  return NextResponse.json({
    providers,
    categories,
    savedProviderIds,
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

  const providerId = parsed.data.providerId;

  if (isSupabaseServerConfigured() && isUuid(session.id) && isUuid(providerId)) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: existing } = await supabase
        .from('saved_providers')
        .select('provider_id')
        .eq('client_id', session.id)
        .eq('provider_id', providerId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('saved_providers')
          .delete()
          .eq('client_id', session.id)
          .eq('provider_id', providerId);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        const savedProviderIds = await fetchSavedProviderIds(session.id);
        return NextResponse.json({ saved: false, savedProviderIds });
      } else {
        const { error } = await supabase
          .from('saved_providers')
          .insert({ client_id: session.id, provider_id: providerId });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        const savedProviderIds = await fetchSavedProviderIds(session.id);
        return NextResponse.json({ saved: true, savedProviderIds });
      }
    }
  }

  const store = getStore();
  const exists = store.providers.some((p) => p.id === providerId);
  if (!exists) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  const current = store.savedProviders[session.id] || [];
  const isSaved = current.includes(providerId);
  const updated = isSaved
    ? current.filter((id) => id !== providerId)
    : [...current, providerId];
  store.savedProviders[session.id] = updated;

  return NextResponse.json({ saved: !isSaved, savedProviderIds: updated });
}
