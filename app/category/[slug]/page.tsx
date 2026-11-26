import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BrowseMarketplace } from '@/components/BrowseMarketplace';
import { CategoryIcon } from '@/components/CategoryIcon';
import { fetchCategories, fetchProviders } from '@/lib/marketplace-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return { title: 'Category Not Found | SkillNext' };
  }
  return {
    title: `${category.name} Professionals in Lagos & Nigeria | SkillNext`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [activeCategories, categoryProviders] = await Promise.all([
    fetchCategories(),
    fetchProviders({ category: slug }),
  ]);
  const category = activeCategories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="bg-[#F8FAFC] min-h-[80vh]">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F766E]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            All Marketplace Categories
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                <CategoryIcon name={category.iconName} className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">
                  {category.name}
                </h1>
                <p className="text-base text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                  {category.description}
                </p>
              </div>
            </div>

            <Link
              href="/signup?role=provider"
              className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 self-start md:self-center"
            >
              List Your {category.name} Practice
            </Link>
          </div>

          {/* Horizontal Category Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2">
            {activeCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors ${
                  cat.slug === slug
                    ? 'bg-[#0F766E] text-white border-[#0F766E]'
                    : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BrowseMarketplace
        initialProviders={categoryProviders}
        categories={activeCategories}
        initialCategorySlug={slug}
        lockedCategory={category}
      />
    </div>
  );
}
