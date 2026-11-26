import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import {
  ensureSupabaseProviderProfile,
  fetchProviderById,
} from '@/lib/marketplace-data';
import { calculateProfileCompleteness, generateId, getStore } from '@/lib/marketplace-store';
import { isUuid } from '@/lib/supabase/config';
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { providerUpdateSchema } from '@/lib/validators';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let provider = await fetchProviderById(id);

  // Auto-provision a Supabase provider profile when an authenticated provider opens their studio for the first time
  if (!provider && isSupabaseServerConfigured() && isUuid(id)) {
    const session = await getCurrentSessionUser();
    if (session && session.id === id && session.role === 'provider') {
      provider = await ensureSupabaseProviderProfile({
        userId: session.id,
        fullName: session.fullName,
        location: session.location,
      });
    }
  }

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  const visibleReviews = provider.reviews.filter((r) => !r.isHidden);
  return NextResponse.json({
    provider: { ...provider, reviews: visibleReviews },
    completeness: calculateProfileCompleteness(provider),
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = providerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid provider update payload' },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Supabase PostgreSQL update path
  if (isSupabaseServerConfigured() && isUuid(id)) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const existing = await fetchProviderById(id);
      if (!existing) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }
      if (existing.userId !== session.id && session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updateFields: Record<string, unknown> = {};
      if (data.businessName) updateFields.business_name = data.businessName.trim();
      if (data.headline) updateFields.headline = data.headline.trim();
      if (data.bio) updateFields.bio = data.bio.trim();
      if (data.location) updateFields.location = data.location.trim();
      if (data.serviceAreas) updateFields.service_areas = data.serviceAreas;
      if (data.skills) updateFields.skills = data.skills;
      if (typeof data.startingPriceNgn === 'number') {
        updateFields.starting_price_ngn = data.startingPriceNgn;
      }
      if (typeof data.yearsExperience === 'number') {
        updateFields.years_experience = data.yearsExperience;
      }
      if (data.responseTime) updateFields.response_time = data.responseTime.trim();
      if (data.avatarUrl) updateFields.avatar_url = data.avatarUrl;

      if (data.categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', data.categorySlug)
          .maybeSingle();
        if (cat?.id) {
          updateFields.category_id = cat.id;
        }
      }

      if (data.submitVerification) {
        updateFields.verification_status = 'pending';
        updateFields.nin_verified = data.submitVerification.idType === 'NIN';
        updateFields.cac_registered = Boolean(data.submitVerification.cacNumber?.trim());
      }

      if (Object.keys(updateFields).length > 0) {
        const { error: upErr } = await supabase
          .from('provider_profiles')
          .update(updateFields)
          .eq('id', existing.id);
        if (upErr) {
          return NextResponse.json({ error: upErr.message }, { status: 400 });
        }
      }

      if (data.addService) {
        const { error: srvErr } = await supabase.from('services').insert({
          provider_id: existing.id,
          title: data.addService.title.trim(),
          description: data.addService.description.trim(),
          price_ngn: data.addService.priceNgn,
          price_unit: data.addService.priceUnit,
          delivery_estimate: data.addService.deliveryEstimate.trim(),
        });
        if (srvErr) {
          return NextResponse.json({ error: srvErr.message }, { status: 400 });
        }
      }

      if (data.removeServiceId && isUuid(data.removeServiceId)) {
        await supabase
          .from('services')
          .delete()
          .eq('id', data.removeServiceId)
          .eq('provider_id', existing.id);
      }

      if (data.addPortfolio) {
        const { error: portErr } = await supabase.from('portfolio_items').insert({
          provider_id: existing.id,
          title: data.addPortfolio.title.trim(),
          description: data.addPortfolio.description.trim(),
          image_url: data.addPortfolio.imageUrl,
          location: data.addPortfolio.location.trim(),
          completed_year: data.addPortfolio.completedYear.trim(),
        });
        if (portErr) {
          return NextResponse.json({ error: portErr.message }, { status: 400 });
        }
      }

      if (data.removePortfolioId && isUuid(data.removePortfolioId)) {
        await supabase
          .from('portfolio_items')
          .delete()
          .eq('id', data.removePortfolioId)
          .eq('provider_id', existing.id);
      }

      if (data.submitVerification) {
        await supabase.from('verification_submissions').insert({
          provider_id: existing.id,
          id_type: data.submitVerification.idType,
          id_last_four: data.submitVerification.idLastFour,
          cac_number: data.submitVerification.cacNumber?.trim() || null,
          document_url: existing.portfolio[0]?.imageUrl || null,
          status: 'pending',
        });
      }

      const refreshed = await fetchProviderById(existing.id);
      if (!refreshed) {
        return NextResponse.json({ error: 'Provider not found after update' }, { status: 404 });
      }
      return NextResponse.json({
        provider: refreshed,
        completeness: calculateProfileCompleteness(refreshed),
      });
    }
  }

  // Fallback preview store path
  const store = getStore();
  const provider =
    store.providers.find((p) => p.id === id) ||
    store.providers.find((p) => p.userId === id);

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  if (provider.userId !== session.id && session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (data.businessName) provider.businessName = data.businessName.trim();
  if (data.headline) provider.headline = data.headline.trim();
  if (data.bio) provider.bio = data.bio.trim();
  if (data.location) provider.location = data.location.trim();
  if (data.serviceAreas) provider.serviceAreas = data.serviceAreas;
  if (data.skills) provider.skills = data.skills;
  if (typeof data.startingPriceNgn === 'number') {
    provider.startingPriceNgn = data.startingPriceNgn;
  }
  if (typeof data.yearsExperience === 'number') {
    provider.yearsExperience = data.yearsExperience;
  }
  if (data.responseTime) provider.responseTime = data.responseTime.trim();
  if (data.avatarUrl) provider.avatarUrl = data.avatarUrl;

  if (data.categorySlug) {
    const cat = store.categories.find((c) => c.slug === data.categorySlug);
    if (cat) {
      provider.categorySlug = cat.slug;
      provider.categoryName = cat.name;
    }
  }

  if (data.addService) {
    provider.services.push({
      id: generateId('srv'),
      providerId: provider.id,
      title: data.addService.title.trim(),
      description: data.addService.description.trim(),
      priceNgn: data.addService.priceNgn,
      priceUnit: data.addService.priceUnit,
      deliveryEstimate: data.addService.deliveryEstimate.trim(),
    });
  }

  if (data.removeServiceId) {
    provider.services = provider.services.filter((s) => s.id !== data.removeServiceId);
  }

  if (data.addPortfolio) {
    provider.portfolio.unshift({
      id: generateId('port'),
      providerId: provider.id,
      title: data.addPortfolio.title.trim(),
      description: data.addPortfolio.description.trim(),
      imageUrl: data.addPortfolio.imageUrl,
      location: data.addPortfolio.location.trim(),
      completedYear: data.addPortfolio.completedYear.trim(),
    });
  }

  if (data.removePortfolioId) {
    provider.portfolio = provider.portfolio.filter((p) => p.id !== data.removePortfolioId);
  }

  if (data.submitVerification) {
    provider.verificationStatus = 'pending';
    provider.ninVerified = data.submitVerification.idType === 'NIN';
    provider.cacRegistered = Boolean(data.submitVerification.cacNumber?.trim());
    store.verifications.unshift({
      id: generateId('ver'),
      providerId: provider.id,
      providerName: provider.fullName,
      businessName: provider.businessName,
      categoryName: provider.categoryName,
      location: provider.location,
      idType: data.submitVerification.idType,
      idLastFour: data.submitVerification.idLastFour,
      cacNumber: data.submitVerification.cacNumber?.trim(),
      portfolioSampleUrl: provider.portfolio[0]?.imageUrl,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    provider,
    completeness: calculateProfileCompleteness(provider),
  });
}
