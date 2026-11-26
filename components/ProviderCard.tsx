'use client';

import Link from 'next/link';
import { ArrowUpRight, Bookmark, CheckCircle2, MapPin, Star } from 'lucide-react';
import { formatNaira } from '@/lib/constants';
import { ProviderProfile } from '@/types';
import { SmartImage } from '@/components/SmartImage';

interface ProviderCardProps {
  provider: ProviderProfile;
  isSaved?: boolean;
  onToggleSave?: (providerId: string) => void;
}

export function ProviderCard({
  provider,
  isSaved = false,
  onToggleSave,
}: ProviderCardProps) {
  const leadImage = provider.portfolio[0]?.imageUrl || provider.avatarUrl;

  return (
    <article className="group glow-card relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1.5 hover:border-[#0F766E]/45">
      {/* Subtle architectural top edge glow on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#0F766E] via-[#D4A017] to-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
      />

      <Link
        href={`/providers/${provider.id}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 block"
      >
        <SmartImage
          src={leadImage}
          alt={`${provider.businessName} featured work`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent transition-opacity duration-300 group-hover:from-slate-950/80" />
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/95 shadow-md shrink-0 bg-slate-200 transition-transform duration-200 group-hover:scale-105">
              <SmartImage
                src={provider.avatarUrl}
                alt={provider.fullName}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate drop-shadow-xs">
                {provider.fullName}
              </p>
              <p className="text-xs text-slate-200 truncate">
                {provider.categoryName}
              </p>
            </div>
          </div>
          {provider.verificationStatus === 'verified' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 shrink-0 drop-shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Verified
            </span>
          )}
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/providers/${provider.id}`}
              className="text-base font-semibold text-[#0F172A] group-hover:text-[#0F766E] transition-colors line-clamp-1"
            >
              {provider.businessName}
            </Link>
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(provider.id)}
                aria-label={isSaved ? 'Remove from saved providers' : 'Save provider'}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  isSaved
                    ? 'text-[#0F766E] bg-teal-50'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {provider.headline}
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 pt-1">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {provider.location}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-slate-700 font-medium tabular-nums">
              <Star className="w-3.5 h-3.5 text-[#D4A017] fill-[#D4A017]" aria-hidden="true" />
              {provider.ratingAvg.toFixed(1)} ({provider.reviewCount})
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{provider.completedJobs} jobs</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[11px] text-slate-500">Starting from</span>
            <span className="text-sm font-bold text-[#0F172A] tabular-nums">
              {formatNaira(provider.startingPriceNgn)}
            </span>
          </div>
          <Link
            href={`/providers/${provider.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50/80 group-hover:bg-[#0F766E] group-hover:text-white group-hover:shadow-[0_8px_18px_-6px_rgba(15,118,110,0.45)] rounded-xl transition-all duration-200 whitespace-nowrap shrink-0"
          >
            View Profile
            <ArrowUpRight
              className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
