import { HomeShowcase } from '@/components/HomeShowcase';
import { getStore } from '@/lib/marketplace-store';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const store = getStore();
  const categories = store.categories.filter((c) => c.isActive);
  const featuredProviders = store.providers.filter((p) => p.isFeatured);

  return (
    <HomeShowcase
      categories={categories}
      featuredProviders={
        featuredProviders.length > 0 ? featuredProviders : store.providers
      }
    />
  );
}
