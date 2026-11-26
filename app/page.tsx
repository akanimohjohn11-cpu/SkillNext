import { HomeShowcase } from '@/components/HomeShowcase';
import { fetchCategories, fetchProviders } from '@/lib/marketplace-data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, allProviders] = await Promise.all([
    fetchCategories(),
    fetchProviders(),
  ]);
  const featuredProviders = allProviders.filter((p) => p.isFeatured);

  return (
    <HomeShowcase
      categories={categories}
      featuredProviders={
        featuredProviders.length > 0 ? featuredProviders : allProviders
      }
    />
  );
}
