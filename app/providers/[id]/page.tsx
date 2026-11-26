import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentSessionUser } from '@/lib/auth-session';
import { getStore } from '@/lib/marketplace-store';
import { ProviderProfileClient } from '@/components/ProviderProfileClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const store = getStore();
  const provider = store.providers.find((p) => p.id === id);
  if (!provider) {
    return { title: 'Provider Not Found | SkillNest' };
  }
  return {
    title: `${provider.businessName} — ${provider.fullName} | SkillNest`,
    description: `${provider.headline} in ${provider.location}. ${provider.bio.slice(0, 140)}`,
  };
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getStore();
  const provider = store.providers.find((p) => p.id === id);

  if (!provider) {
    notFound();
  }

  const session = await getCurrentSessionUser();
  const savedIds = session ? store.savedProviders[session.id] || [] : [];
  const visibleReviews = provider.reviews.filter((r) => !r.isHidden);

  return (
    <ProviderProfileClient
      initialProvider={{ ...provider, reviews: visibleReviews }}
      initialSaved={savedIds.includes(provider.id)}
    />
  );
}
