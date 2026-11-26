'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Filter, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { Category, ProviderProfile } from '@/types';
import { LAGOS_LOCATIONS } from '@/lib/constants';
import { ProviderCard } from '@/components/ProviderCard';
import { useAuth } from '@/components/AuthProvider';

interface BrowseMarketplaceProps {
  initialProviders: ProviderProfile[];
  categories: Category[];
  initialCategorySlug?: string;
  initialQuery?: string;
  initialLocation?: string;
  lockedCategory?: Category;
}

export function BrowseMarketplace({
  initialProviders,
  categories,
  initialCategorySlug = 'all',
  initialQuery = '',
  initialLocation = 'All Lagos & Nigeria',
  lockedCategory,
}: BrowseMarketplaceProps) {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProviderProfile[]>(initialProviders);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(
    lockedCategory ? lockedCategory.slug : initialCategorySlug
  );
  const [location, setLocation] = useState(initialLocation);
  const [minRating, setMinRating] = useState('0');
  const [maxPrice, setMaxPrice] = useState('0');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('featured');

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (categorySlug && categorySlug !== 'all') params.set('category', categorySlug);
      if (location && location !== 'All Lagos & Nigeria') params.set('location', location);
      if (Number(minRating) > 0) params.set('minRating', minRating);
      if (Number(maxPrice) > 0) params.set('maxPrice', maxPrice);
      if (verifiedOnly) params.set('verified', 'true');
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/providers?${params.toString()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
        setSavedIds(data.savedProviderIds || []);
      }
    } finally {
      setLoading(false);
    }
  }, [query, categorySlug, location, minRating, maxPrice, verifiedOnly, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchProviders]);

  const handleToggleSave = async (providerId: string) => {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const res = await fetch('/api/providers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'SkillNestClient',
      },
      body: JSON.stringify({ providerId }),
    });
    if (res.ok) {
      const data = await res.json();
      setSavedIds(data.savedProviderIds || []);
    }
  };

  const handleReset = () => {
    setQuery('');
    setCategorySlug(lockedCategory ? lockedCategory.slug : 'all');
    setLocation('All Lagos & Nigeria');
    setMinRating('0');
    setMaxPrice('0');
    setVerifiedOnly(false);
    setSort('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search & Filter Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills, business names, or services..."
              aria-label="Search skills or providers"
              className="w-full h-11 pl-10 pr-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          {!lockedCategory && (
            <div className="md:col-span-3">
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                aria-label="Filter by category"
                className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#0F766E]"
              >
                <option value="all">All 13 Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={lockedCategory ? 'md:col-span-4' : 'md:col-span-4'}>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Filter by location"
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#0F766E]"
            >
              {LAGOS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              Refine:
            </span>

            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              aria-label="Minimum rating"
              className="h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="0">Any rating</option>
              <option value="4.5">4.5+ stars</option>
              <option value="4.8">4.8+ stars</option>
            </select>

            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              aria-label="Maximum starting budget"
              className="h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="0">Any budget (₦)</option>
              <option value="150000">Up to ₦150,000</option>
              <option value="300000">Up to ₦300,000</option>
              <option value="500000">Up to ₦500,000</option>
            </select>

            <button
              type="button"
              onClick={() => setVerifiedOnly((v) => !v)}
              className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap ${
                verifiedOnly
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Verified Only
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort results"
              className="h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="featured">Recommended</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Lowest Starting Rate</option>
              <option value="price_desc">Highest Starting Rate</option>
            </select>

            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 inline-flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <p className="text-sm text-slate-600 tabular-nums">
          Showing <span className="font-semibold text-[#0F172A]">{providers.length}</span>{' '}
          {providers.length === 1 ? 'professional' : 'professionals'}
          {lockedCategory ? ` in ${lockedCategory.name}` : ''}
        </p>
        <Link
          href={user ? '/dashboard/client' : '/signup?role=client'}
          className="text-sm font-semibold text-[#0F766E] hover:text-[#0D5E58]"
        >
          Need tailored quotes? Post a service request →
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
          <h3 className="text-lg font-semibold text-[#0F172A]">
            No professionals matched those exact filters
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Try widening your Lagos neighborhood selection or budget cap, or post a custom
            brief so vetted pros can respond directly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Reset Filters
            </button>
            <Link
              href={user ? '/dashboard/client' : '/signup?role=client'}
              className="px-5 py-2.5 bg-white border border-slate-300 text-sm font-semibold text-[#0F172A] rounded-lg hover:bg-slate-50 transition-colors"
            >
              Post a Service Request
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isSaved={savedIds.includes(provider.id)}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
