import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { calculateProfileCompleteness, generateId, getStore } from '@/lib/marketplace-store';
import { providerUpdateSchema } from '@/lib/validators';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const store = getStore();
  const provider =
    store.providers.find((p) => p.id === id) ||
    store.providers.find((p) => p.userId === id);

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

  const body = await req.json().catch(() => null);
  const parsed = providerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid provider update payload' },
      { status: 400 }
    );
  }

  const data = parsed.data;
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
