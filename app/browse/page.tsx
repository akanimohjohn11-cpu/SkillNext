import type { Metadata } from 'next';
import { BrowseMarketplace } from '@/components/BrowseMarketplace';
import { fetchCategories, fetchProviders } from '@/lib/marketplace-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Browse Verified Professionals | SkillNext Nigeria',
  description:
    'Search and filter vetted Nigerian architects, engineers, designers, lawyers, and tradespeople by Lagos location, rating, and Naira budget.',
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>;
}) {
  const params = await searchParams;
  const [providers, categories] = await Promise.all([
    fetchProviders(),
    fetchCategories(),
  ]);

  return (
    <div className="bg-[#F8FAFC] min-h-[80vh]">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-sm font-medium text-[#0F766E]">SkillNext Directory</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-2">
            Find vetted professionals in Lagos & Nigeria
          </h1>
          <p className="text-base text-slate-600 mt-2 max-w-2xl">
            Every verified badge represents manual NIN/CAC identity screening and real
            portfolio inspection.
          </p>
        </div>
      </section>

      <BrowseMarketplace
        initialProviders={providers}
        categories={categories}
        initialCategorySlug={params.category || 'all'}
        initialQuery={params.q || ''}
        initialLocation={params.location || 'All Lagos & Nigeria'}
      />
    </div>
  );
}
