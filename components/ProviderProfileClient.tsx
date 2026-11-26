'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { ProviderProfile } from '@/types';
import { formatNaira, LAGOS_LOCATIONS } from '@/lib/constants';
import { SmartImage } from '@/components/SmartImage';
import { useAuth } from '@/components/AuthProvider';

export function ProviderProfileClient({
  initialProvider,
  initialSaved,
}: {
  initialProvider: ProviderProfile;
  initialSaved: boolean;
}) {
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile>(initialProvider);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [portfolioIndex, setPortfolioIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Inquiry form state
  const [subject, setSubject] = useState('');
  const [budgetNgn, setBudgetNgn] = useState(String(initialProvider.startingPriceNgn));
  const [preferredDate, setPreferredDate] = useState('');
  const [location, setLocation] = useState(initialProvider.location);
  const [message, setMessage] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryFeedback, setInquiryFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const portfolio = provider.portfolio;
  const activePortfolio = portfolio[portfolioIndex];

  const handleToggleSave = async () => {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(`/providers/${provider.id}`)}`;
      return;
    }
    const res = await fetch('/api/providers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'SkillNestClient',
      },
      body: JSON.stringify({ providerId: provider.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsSaved(Boolean(data.saved));
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryFeedback(null);
    setInquirySubmitting(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'SkillNestClient',
        },
        body: JSON.stringify({
          providerId: provider.id,
          subject,
          budgetNgn: budgetNgn ? Number(budgetNgn) : undefined,
          preferredDate: preferredDate || undefined,
          location,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInquiryFeedback({
          type: 'error',
          text: data.error || 'Could not send inquiry.',
        });
      } else {
        setInquiryFeedback({
          type: 'success',
          text: `Inquiry sent to ${provider.fullName}. View your conversation anytime in your dashboard.`,
        });
        setSubject('');
        setMessage('');
      }
    } catch {
      setInquiryFeedback({
        type: 'error',
        text: 'Network error while sending inquiry.',
      });
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewFeedback(null);
    setReviewSubmitting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'SkillNestClient',
        },
        body: JSON.stringify({
          providerId: provider.id,
          rating: reviewRating,
          projectTitle: reviewTitle,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewFeedback({
          type: 'error',
          text: data.error || 'Unable to submit review.',
        });
      } else {
        setProvider(data.provider);
        setReviewTitle('');
        setReviewComment('');
        setReviewFeedback({
          type: 'success',
          text: 'Thank you. Your verified review is now published.',
        });
      }
    } catch {
      setReviewFeedback({
        type: 'error',
        text: 'Network error while submitting review.',
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {/* Header Profile Summary */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                <SmartImage
                  src={provider.avatarUrl}
                  alt={provider.fullName}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                  <Link
                    href={`/category/${provider.categorySlug}`}
                    className="font-semibold text-[#0F766E] hover:underline"
                  >
                    {provider.categoryName}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    {provider.location}
                  </span>
                  {provider.verificationStatus === 'verified' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0F766E]">
                        <ShieldCheck className="w-4 h-4 text-[#D4A017]" aria-hidden="true" />
                        Identity & Credential Verified
                      </span>
                    </>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                  {provider.businessName}
                </h1>
                <p className="text-base text-slate-700 font-medium">
                  Led by {provider.fullName} — {provider.headline}
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-slate-600 tabular-nums">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                    <Star className="w-4 h-4 text-[#D4A017] fill-[#D4A017]" aria-hidden="true" />
                    {provider.ratingAvg.toFixed(1)} ({provider.reviewCount} reviews)
                  </span>
                  <span>{provider.completedJobs} completed projects</span>
                  <span>{provider.yearsExperience} years experience</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    {provider.responseTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleToggleSave}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                  isSaved
                    ? 'bg-teal-50 text-[#0F766E] border-[#0F766E]'
                    : 'bg-white text-[#0F172A] border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
                {isSaved ? 'Saved' : 'Save Pro'}
              </button>
              <a
                href="#inquiry-panel"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0F766E] hover:bg-[#0D5E58] text-white transition-colors"
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                Request Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left 8 Columns: Portfolio, Bio, Services, Reviews */}
        <div className="lg:col-span-8 space-y-10">
          {/* Portfolio Carousel */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">Selected Portfolio</h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Verified project documentation across Lagos
                </p>
              </div>
              {portfolio.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPortfolioIndex((i) => (i - 1 + portfolio.length) % portfolio.length)
                    }
                    aria-label="Previous portfolio item"
                    className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortfolioIndex((i) => (i + 1) % portfolio.length)}
                    aria-label="Next portfolio item"
                    className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {activePortfolio ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="glow-card relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-[#0F766E]/45 block text-left group"
                >
                  <SmartImage
                    src={activePortfolio.imageUrl}
                    alt={activePortfolio.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <span className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md text-xs font-semibold text-[#0F172A] opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm">
                    Inspect Full Resolution
                  </span>
                </button>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-[#0F172A]">
                      {activePortfolio.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {activePortfolio.description}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0 tabular-nums">
                    {activePortfolio.location} · {activePortfolio.completedYear}
                  </p>
                </div>

                {portfolio.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pt-1">
                    {portfolio.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPortfolioIndex(idx)}
                        className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          idx === portfolioIndex
                            ? 'border-[#0F766E]'
                            : 'border-transparent opacity-65 hover:opacity-100'
                        }`}
                      >
                        <SmartImage
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-6">
                No portfolio uploads published yet. Send an inquiry to request recent project
                photographs.
              </p>
            )}
          </section>

          {/* About & Skills */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">About the Practice</h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed mt-3">
                {provider.bio}
              </p>
            </div>

            <div className="pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-2">
                  Core Specialties
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {provider.skills.join(' · ')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-2">
                  Service Coverage Areas
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {provider.serviceAreas.join(' · ')}
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    provider.ninVerified ? 'text-[#0F766E]' : 'text-slate-300'
                  }`}
                  aria-hidden="true"
                />
                {provider.ninVerified ? 'NIN Identity Screened' : 'NIN Pending'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    provider.cacRegistered ? 'text-[#0F766E]' : 'text-slate-300'
                  }`}
                  aria-hidden="true"
                />
                {provider.cacRegistered
                  ? 'CAC Business Verified'
                  : 'Independent Sole Practitioner'}
              </span>
            </div>
          </section>

          {/* Service Packages & Rate Card */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A]">
              Transparent Services & Rates
            </h2>
            <div className="divide-y divide-slate-100">
              {provider.services.map((srv) => (
                <div
                  key={srv.id}
                  className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[#0F172A]">
                      {srv.title}
                    </h3>
                    <p className="text-sm text-slate-600">{srv.description}</p>
                    <p className="text-xs text-slate-500">
                      Estimated turnaround: {srv.deliveryEstimate}
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="block text-[11px] text-slate-500">
                      {srv.priceUnit === 'starting_at'
                        ? 'Starting from'
                        : srv.priceUnit === 'hourly'
                          ? 'Hourly rate'
                          : srv.priceUnit === 'per_day'
                            ? 'Daily rate'
                            : 'Fixed fee'}
                    </span>
                    <span className="text-lg font-bold text-[#0F172A] tabular-nums">
                      {formatNaira(srv.priceNgn)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews & Submit Review */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0F172A]">
                Client Reviews ({provider.reviews.length})
              </h2>
              <span className="text-sm font-semibold text-[#0F172A] tabular-nums inline-flex items-center gap-1">
                <Star className="w-4 h-4 text-[#D4A017] fill-[#D4A017]" aria-hidden="true" />
                {provider.ratingAvg.toFixed(1)} / 5.0
              </span>
            </div>

            {provider.reviews.length === 0 ? (
              <p className="text-sm text-slate-500">
                No reviews published yet. Have you worked with {provider.fullName}? Share
                your experience below.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {provider.reviews.map((rev) => (
                  <article key={rev.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {rev.projectTitle}
                        </p>
                        <p className="text-xs text-slate-500">
                          {rev.clientName} · {rev.clientLocation}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#0F172A] tabular-nums inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#D4A017] fill-[#D4A017]" aria-hidden="true" />
                        {rev.rating}.0
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{rev.comment}</p>
                  </article>
                ))}
              </div>
            )}

            {/* Leave Review Form */}
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-base font-semibold text-[#0F172A] mb-3">
                Leave a Verified Review
              </h3>
              {!user ? (
                <p className="text-sm text-slate-600">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/providers/${provider.id}`)}`}
                    className="font-semibold text-[#0F766E] hover:underline"
                  >
                    Sign in to your client account
                  </Link>{' '}
                  to rate and review completed work with {provider.businessName}.
                </p>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Project Title
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="e.g., Office Solar & Inverter Setup"
                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Rating
                      </label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                      >
                        <option value={5}>5 — Exceptional craftsmanship</option>
                        <option value={4}>4 — Very reliable</option>
                        <option value={3}>3 — Satisfactory</option>
                        <option value={2}>2 — Needs improvement</option>
                        <option value={1}>1 — Unsatisfactory</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Review Details
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share punctuality, communication, and quality of delivery..."
                      className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  {reviewFeedback && (
                    <p
                      className={`text-xs font-medium ${
                        reviewFeedback.type === 'success'
                          ? 'text-[#0F766E]'
                          : 'text-red-600'
                      }`}
                    >
                      {reviewFeedback.text}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Publish Review'}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>

        {/* Right 4 Columns: High-Intent Inquiry Conversion Panel */}
        <aside id="inquiry-panel" className="lg:col-span-4">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="pb-4 border-b border-slate-100">
              <p className="text-xs text-slate-500">Starting fee</p>
              <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-0.5">
                {formatNaira(provider.startingPriceNgn)}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Typical response: {provider.responseTime}
              </p>
            </div>

            {!user ? (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Send a Direct Project Inquiry
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Create a free client account in 30 seconds to message {provider.fullName},
                  share project specifications, and track Naira quotes securely.
                </p>
                <div className="space-y-2.5">
                  <Link
                    href={`/signup?role=client&next=${encodeURIComponent(`/providers/${provider.id}`)}`}
                    className="block w-full py-3 px-4 text-center bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Sign Up Free to Message Pro
                  </Link>
                  <Link
                    href={`/login?next=${encodeURIComponent(`/providers/${provider.id}`)}`}
                    className="block w-full py-2.5 px-4 text-center bg-white border border-slate-300 hover:bg-slate-50 text-[#0F172A] text-sm font-semibold rounded-lg transition-colors"
                  >
                    Already have an account? Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-3.5">
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Message {provider.fullName}
                </h2>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Project Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., 3-Bedroom Lekki Fit-Out Quote"
                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Est. Budget (₦)
                    </label>
                    <input
                      type="number"
                      min={5000}
                      value={budgetNgn}
                      onChange={(e) => setBudgetNgn(e.target.value)}
                      className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full h-10 px-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Neighborhood / Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                  >
                    {LAGOS_LOCATIONS.filter((l) => l !== 'All Lagos & Nigeria').map(
                      (loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Scope & Requirements
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe dimensions, timeline, or deliverables..."
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                {inquiryFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium ${
                      inquiryFeedback.type === 'success'
                        ? 'bg-teal-50 text-[#0F766E] border border-teal-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {inquiryFeedback.text}{' '}
                    {inquiryFeedback.type === 'success' && (
                      <Link href="/dashboard/client" className="underline font-semibold">
                        Open Messages
                      </Link>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="w-full py-3 px-4 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {inquirySubmitting ? 'Sending Inquiry...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>

      {/* Portfolio Lightbox Modal */}
      {lightboxOpen && activePortfolio && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activePortfolio.title}
        >
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 text-[#0F172A] flex items-center justify-center shadow"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-[16/10] w-full bg-slate-100">
              <SmartImage
                src={activePortfolio.imageUrl}
                alt={activePortfolio.title}
                fill
                sizes="90vw"
                className="object-cover"
              />
            </div>
            <div className="p-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A]">
                  {activePortfolio.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {activePortfolio.description}
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 shrink-0 tabular-nums">
                {activePortfolio.location} · {activePortfolio.completedYear}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
