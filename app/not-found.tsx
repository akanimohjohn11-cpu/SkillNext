import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { SEED_CATEGORIES } from '@/lib/constants';

export default function NotFound() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <p className="text-sm font-semibold text-[#0F766E] mb-3">Page Not Found</p>
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] text-balance">
        We couldn&apos;t find that page, but your next pro is right here.
      </h1>
      <p className="text-base text-slate-600 mt-4 max-w-xl mx-auto leading-relaxed">
        The link you followed may have moved or been updated. Search our vetted Lagos
        professionals or jump directly into a category below.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          Browse Verified Pros
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 text-sm font-semibold rounded-lg transition-colors"
        >
          Return Home
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-14 pt-10 border-t border-slate-200 text-left">
        <h2 className="text-sm font-semibold text-[#0F172A] mb-4 text-center">
          Popular Categories in Lagos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SEED_CATEGORIES.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="p-3.5 bg-white border border-slate-200 hover:border-[#0F766E] rounded-lg text-sm font-medium text-slate-700 hover:text-[#0F766E] transition-colors flex items-center justify-between"
            >
              <span className="truncate">{cat.name}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
