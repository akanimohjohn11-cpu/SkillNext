import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentSessionUser } from '@/lib/auth-session';
import { fetchProviderById, fetchSavedProviderIds } from '@/lib/marketplace-data';
import { ProviderProfileClient } from '@/components/ProviderProfileClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const provider = await fetchProviderById(id);
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
  const [provider, session] = await Promise.all([
    fetchProviderById(id),
    getCurrentSessionUser(),
  ]);

  if (!provider) {
    notFound();
  }

  const savedIds = await fetchSavedProviderIds(session?.id);
  const visibleReviews = provider.reviews.filter((r) => !r.isHidden);

  return (
    <ProviderProfileClient
      initialProvider={{ ...provider, reviews: visibleReviews }}
      initialSaved={savedIds.includes(provider.id)}
    />
  );
}
