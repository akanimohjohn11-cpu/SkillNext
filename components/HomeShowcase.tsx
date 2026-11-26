'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Category, ProviderProfile } from '@/types';
import { formatNaira, GENERATED_IMAGES, LAGOS_LOCATIONS } from '@/lib/constants';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ProviderCard } from '@/components/ProviderCard';
import { SmartImage } from '@/components/SmartImage';

interface HomeShowcaseProps {
  categories: Category[];
  featuredProviders: ProviderProfile[];
}

const HERO_DISPLAY_SLIDES = [
  {
    id: 'slide-studio',
    image: GENERATED_IMAGES.hero,
    alt: 'Nigerian architects reviewing timber samples and blueprints in Victoria Island Lagos studio',
    badge: 'NIN & CAC Verified',
    rating: '4.9',
    note: 'Manual ID & live studio audit completed before listing goes live.',
    providerId: 'prov-amara-atelier',
    providerName: 'Studio Okafor Architecture',
    providerAvatar: GENERATED_IMAGES.architectPortrait,
    providerMeta: 'Victoria Island · 42 completed builds',
    metric1Label: 'Consult',
    metric1Value: formatNaira(150000),
    metric2Label: '3D Design',
    metric2Value: formatNaira(350000),
    responseTime: '< 1 hr',
  },
  {
    id: 'slide-solar',
    image: GENERATED_IMAGES.solarPortfolio,
    alt: 'Completed 10kVA hybrid lithium solar inverter installation in Lekki Phase 1 Lagos',
    badge: 'NEMSA & COREN Vetted',
    rating: '4.9',
    note: 'Commissioned hybrid power walls backed by 3-year workmanship warranty.',
    providerId: 'prov-tunde-solar',
    providerName: 'Balogun Solar & Power Engineering',
    providerAvatar: GENERATED_IMAGES.techPortrait,
    providerMeta: 'Lekki Phase 1 · 89 installations',
    metric1Label: 'Audit',
    metric1Value: formatNaira(45000),
    metric2Label: '10kVA Turnkey',
    metric2Value: formatNaira(3200000),
    responseTime: '< 45 mins',
  },
  {
    id: 'slide-atelier',
    image: GENERATED_IMAGES.atelierPortfolio,
    alt: 'Bespoke luxury bridal and formal tailoring atelier in Ikeja GRA Lagos',
    badge: 'Portfolio Verified',
    rating: '5.0',
    note: 'Hand-beaded Aso-Oke and structured bridal tailoring with scheduled fittings.',
    providerId: 'prov-zainab-couture',
    providerName: 'Maison Bello Couture',
    providerAvatar: GENERATED_IMAGES.fashionPortrait,
    providerMeta: 'Ikeja GRA · 134 commissions',
    metric1Label: 'Consultation',
    metric1Value: formatNaira(35000),
    metric2Label: 'Bespoke Suit',
    metric2Value: formatNaira(220000),
    responseTime: '< 2 hrs',
  },
];

const PROJECT_GALLERY = [
  {
    id: 'proj-ikoyi',
    title: 'Ikoyi Waterfront Residence Refit',
    location: 'Ikoyi, Lagos',
    category: 'Interior Architecture',
    image: GENERATED_IMAGES.residencePortfolio,
    providerName: 'Studio Okafor Architecture',
    providerId: 'prov-amara-atelier',
    value: formatNaira(4850000),
    timeline: '6 weeks handover',
  },
  {
    id: 'proj-solar',
    title: '10kVA Lithium Hybrid Power Wall',
    location: 'Lekki Phase 1, Lagos',
    category: 'Solar & Power',
    image: GENERATED_IMAGES.solarPortfolio,
    providerName: 'Balogun Solar & Power',
    providerId: 'prov-tunde-solar',
    value: formatNaira(3200000),
    timeline: '4 days commissioning',
  },
  {
    id: 'proj-boardroom',
    title: 'Victoria Island Executive Boardroom',
    location: 'Victoria Island, Lagos',
    category: 'Commercial Fit-Out',
    image: GENERATED_IMAGES.boardroomPortfolio,
    providerName: 'Adebayo Civil & Build',
    providerId: 'prov-adebayo-build',
    value: formatNaira(6400000),
    timeline: '8 weeks build',
  },
  {
    id: 'proj-atelier',
    title: 'Custom Traditional & Bridal Atelier',
    location: 'Ikeja GRA, Lagos',
    category: 'Fashion & Couture',
    image: GENERATED_IMAGES.atelierPortfolio,
    providerName: 'Maison Bello Couture',
    providerId: 'prov-zainab-couture',
    value: formatNaira(450000),
    timeline: '2 weeks tailoring',
  },
  {
    id: 'proj-studio',
    title: 'Bespoke Timber & Concept Studio',
    location: 'Victoria Island, Lagos',
    category: 'Architectural Design',
    image: GENERATED_IMAGES.hero,
    providerName: 'Studio Okafor Architecture',
    providerId: 'prov-amara-atelier',
    value: formatNaira(1850000),
    timeline: '3 weeks blueprints',
  },
];

const TESTIMONIALS = [
  {
    name: 'Oluwaseun Adeyinka',
    role: 'Managing Partner, Eko Haven Properties',
    location: 'Victoria Island, Lagos',
    project: 'Two-townhouse architectural & solar handover',
    quote:
      'We needed an ARCON-registered architect and a NEMSA solar team for two Ikoyi townhouses under tight handover deadlines. Through SkillNext, both contractors delivered on schedule with transparent Naira milestones.',
  },
  {
    name: 'Chidinma Nwankwo',
    role: 'Operations Director, Cresta Health Clinic',
    location: 'Lekki Phase 1, Lagos',
    project: '45sqm outpatient reception refit',
    quote:
      'Previously, sourcing reliable tradespeople in Lagos meant weeks of phone tag and unverified referrals. SkillNext let us compare verified portfolios and lock in our clinic refit within 48 hours.',
  },
  {
    name: 'Ibrahim Danjuma',
    role: 'Homeowner & Diaspora Investor',
    location: 'Ikeja GRA, Lagos',
    project: 'Remote residential renovation & legal charting',
    quote:
      'Hiring from London used to feel risky. Reviewing CAC credentials, verified Lagos client ratings, and clear project scopes inside one thread gave our family complete confidence.',
  },
];

const QUICK_SEARCH_TERMS = [
  { label: 'Solar Installers', href: '/browse?q=solar' },
  { label: 'Interior Architects', href: '/category/home-services' },
  { label: 'Lagos Land Lawyers', href: '/category/professional-services' },
  { label: 'Bespoke Couture', href: '/category/fashion-beauty' },
];

export function HomeShowcase({
  categories,
  featuredProviders,
}: HomeShowcaseProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Lagos & Nigeria');
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const categoryTrackRef = useRef<HTMLDivElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);

  const maxStart = Math.max(0, featuredProviders.length - 3);
  const activeHero = HERO_DISPLAY_SLIDES[heroSlideIndex];
  const activeTestimonial = TESTIMONIALS[testimonialIndex];

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedLocation !== 'All Lagos & Nigeria') {
      params.set('location', selectedLocation);
    }
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const scrollHorizontal = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'prev' | 'next'
  ) => {
    if (!ref.current) return;
    const distance = Math.max(320, ref.current.clientWidth * 0.72);
    ref.current.scrollBy({
      left: direction === 'next' ? distance : -distance,
      behavior: 'smooth',
    });
  };

  return (
    <div className="bg-[#F8FAFC] overflow-x-clip">
      {/* 1. ELEVATED HERO SECTION WITH GLOWING INTERACTIVE DISPLAY CAROUSEL */}
      <section className="relative border-b border-slate-200 bg-white overflow-hidden">
        {/* Subtle atmospheric teal/gold radial accent behind hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 w-[560px] h-[560px] rounded-full bg-radial from-[#0F766E]/10 via-[#D4A017]/5 to-transparent blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Copy, Search & Dual CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-between gap-7"
            >
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#0F766E]">
                  Identity-verified craftsmanship across Lagos & Nigeria
                </p>
                <h1 className="text-[clamp(2.25rem,4vw,3.65rem)] font-bold tracking-tight text-[#0F172A] leading-[1.07] text-balance">
                  Hire trusted Nigerian professionals with proven work.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  Connect directly with NIN-vetted architects, solar engineers, bespoke
                  designers, legal counsel, and master tradespeople. Compare transparent
                  Naira rates and real local portfolios before you book.
                </p>
              </div>

              {/* Search Bar */}
              <div className="space-y-3">
                <form
                  onSubmit={handleHeroSearch}
                  className="bg-[#F8FAFC] border border-slate-200 hover:border-[#0F766E]/45 focus-within:border-[#0F766E] focus-within:shadow-[0_12px_30px_-14px_rgba(15,118,110,0.28)] rounded-2xl p-2 flex flex-col sm:flex-row gap-2 transition-all duration-200 shadow-xs"
                >
                  <div className="relative flex-1">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Try solar installer, architect, lawyer..."
                      aria-label="Search skills or services"
                      className="w-full h-11 pl-10 pr-3 bg-white border border-slate-200 rounded-xl text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E]"
                    />
                  </div>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    aria-label="Filter by Lagos neighborhood or city"
                    className="h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-[#0F766E]"
                  >
                    {LAGOS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="h-11 px-5 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_10px_24px_-8px_rgba(15,118,110,0.5)] whitespace-nowrap shrink-0"
                  >
                    Search Pros
                  </button>
                </form>

                {/* Quick text links */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <span>Popular in Lagos:</span>
                  {QUICK_SEARCH_TERMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="font-medium text-slate-700 hover:text-[#0F766E] underline underline-offset-4 decoration-slate-300 hover:decoration-[#0F766E] transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Dual CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/browse"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-10px_rgba(15,118,110,0.55)] whitespace-nowrap shrink-0"
                >
                  Find a Pro
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/signup?role=provider"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 hover:border-[#0F766E] text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap shrink-0"
                >
                  Become a Provider
                </Link>
              </div>
            </motion.div>

            {/* Right Interactive Showcase Frame with Ambient Teal/Gold Glow */}
            <div className="lg:col-span-6 relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#0F766E]/20 via-[#D4A017]/12 to-transparent blur-2xl opacity-75"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative min-h-[400px] lg:min-h-[500px] h-full rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-[0_24px_55px_-18px_rgba(15,23,42,0.35)] group"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHero.id}
                    initial={{ opacity: 0.35, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.35 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    <SmartImage
                      src={activeHero.image}
                      alt={activeHero.alt}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/20" />

                {/* Top Left: Hero Showcase Carousel Controls */}
                <div className="absolute top-5 left-5 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() =>
                      setHeroSlideIndex(
                        (i) => (i - 1 + HERO_DISPLAY_SLIDES.length) % HERO_DISPLAY_SLIDES.length
                      )
                    }
                    aria-label="Previous showcase project"
                    className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 text-[#0F172A] hover:bg-white hover:text-[#0F766E] flex items-center justify-center shadow-md transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHeroSlideIndex((i) => (i + 1) % HERO_DISPLAY_SLIDES.length)
                    }
                    aria-label="Next showcase project"
                    className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 text-[#0F172A] hover:bg-white hover:text-[#0F766E] flex items-center justify-center shadow-md transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="hidden sm:flex items-center gap-1.5 ml-1 px-2.5 py-1.5 rounded-xl bg-slate-950/45 backdrop-blur-md">
                    {HERO_DISPLAY_SLIDES.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setHeroSlideIndex(idx)}
                        aria-label={`Show hero project ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          idx === heroSlideIndex
                            ? 'w-5 bg-[#D4A017]'
                            : 'w-1.5 bg-white/60 hover:bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Top Right Display Output Card: Verified Studio Output */}
                <motion.div
                  key={`top-${activeHero.id}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -3 }}
                  className="hidden sm:block absolute top-5 right-5 max-w-[255px] bg-white/95 backdrop-blur-md border border-white/70 rounded-xl p-3.5 shadow-[0_14px_34px_-10px_rgba(15,23,42,0.35)] hover:shadow-[0_18px_38px_-10px_rgba(15,118,110,0.45)] transition-shadow z-10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0F766E] inline-flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-[#D4A017]" aria-hidden="true" />
                      {activeHero.badge}
                    </span>
                    <span className="text-xs font-semibold text-[#0F172A] tabular-nums inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-[#D4A017] fill-[#D4A017]" aria-hidden="true" />
                      {activeHero.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-snug">
                    {activeHero.note}
                  </p>
                </motion.div>

                {/* Bottom Display Output Card: Live Provider Profile & Naira Quote Preview */}
                <motion.div
                  key={`bottom-${activeHero.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -3 }}
                  className="absolute bottom-5 left-5 right-5 sm:right-auto sm:w-[390px] bg-white/95 backdrop-blur-md border border-white/70 rounded-xl p-4 shadow-[0_20px_44px_-12px_rgba(15,23,42,0.45)] hover:shadow-[0_24px_48px_-12px_rgba(15,118,110,0.45)] transition-shadow z-10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                        <SmartImage
                          src={activeHero.providerAvatar}
                          alt={activeHero.providerName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F172A] truncate">
                          {activeHero.providerName}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {activeHero.providerMeta}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/providers/${activeHero.providerId}`}
                      className="p-2 rounded-lg bg-[#F1F5F9] hover:bg-[#0F766E] text-[#0F172A] hover:text-white transition-colors shrink-0"
                      aria-label={`Inspect ${activeHero.providerName} profile`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs tabular-nums">
                    <div>
                      <span className="block text-[11px] text-slate-500">
                        {activeHero.metric1Label}
                      </span>
                      <span className="font-bold text-[#0F172A]">
                        {activeHero.metric1Value}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">
                        {activeHero.metric2Label}
                      </span>
                      <span className="font-bold text-[#0F172A]">
                        {activeHero.metric2Value}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">Response</span>
                      <span className="font-semibold text-[#0F766E]">
                        {activeHero.responseTime}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* 4-Column Full-Width Trust Strip */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                stat: '600+',
                desc: 'Vetted specialists across 13 Nigerian sectors',
              },
              {
                stat: '100%',
                desc: 'Manual NIN, portfolio & credential screening',
              },
              {
                stat: 'Under 2 hrs',
                desc: 'Median first response from Lagos providers',
              },
              {
                stat: '₦0 Fees',
                desc: 'Free for clients to browse, post briefs & inquire',
              },
            ].map((item) => (
              <div
                key={item.stat}
                className="glow-card p-3.5 rounded-xl border border-transparent hover:border-[#0F766E]/25 hover:bg-white transition-all"
              >
                <p className="text-2xl font-bold text-[#0F172A] tabular-nums">
                  {item.stat}
                </p>
                <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES HORIZONTAL CAROUSEL + SECTOR HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Explore Nigerian Skill Categories
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              From Ikoyi residential renovations to Lekki solar installations and CAC
              corporate filings, glide across all 13 vetted service sectors.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollHorizontal(categoryTrackRef, 'prev')}
                aria-label="Scroll categories left"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-[#0F766E] hover:text-[#0F766E] hover:shadow-sm flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollHorizontal(categoryTrackRef, 'next')}
                aria-label="Scroll categories right"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-[#0F766E] hover:text-[#0F766E] hover:shadow-sm flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Link
              href="/browse"
              className="group text-sm font-semibold text-[#0F766E] hover:text-[#0D5E58] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ml-1"
            >
              View all
              <ArrowRight
                className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        <div
          ref={categoryTrackRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 -mx-1 px-1"
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group glow-card snap-start shrink-0 w-[268px] sm:w-[290px] bg-white border border-slate-200/90 hover:border-[#0F766E]/55 rounded-2xl p-5 hover:-translate-y-1 flex flex-col justify-between gap-4 relative overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#0F766E] to-[#D4A017] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              />
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#F1F5F9] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white group-hover:shadow-[0_10px_20px_-8px_rgba(15,118,110,0.5)] flex items-center justify-center transition-all duration-200 group-hover:scale-105 shrink-0">
                  <CategoryIcon name={category.iconName} className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-500 tabular-nums inline-flex items-center gap-1">
                  {category.providerCount} pros
                  <ArrowUpRight
                    className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-[#0F766E] transition-all duration-150"
                    aria-hidden="true"
                  />
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PROVIDERS CAROUSEL */}
      <section className="bg-[#F1F5F9] border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Featured Lagos & Nigerian Professionals
              </h2>
              <p className="text-base text-slate-600 mt-2">
                Identity-verified specialists with real portfolios and audited client reviews.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxStart + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCarouselIndex(idx)}
                    aria-label={`Show featured slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      carouselIndex === idx
                        ? 'w-6 bg-[#0F766E]'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                  disabled={carouselIndex === 0}
                  aria-label="Previous featured providers"
                  className="w-10 h-10 rounded-xl border border-slate-300 bg-white text-slate-700 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-40 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCarouselIndex((i) => Math.min(maxStart, i + 1))}
                  disabled={carouselIndex >= maxStart}
                  aria-label="Next featured providers"
                  className="w-10 h-10 rounded-xl border border-slate-300 bg-white text-slate-700 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-40 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={carouselIndex}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {featuredProviders
                .slice(carouselIndex, carouselIndex + 3)
                .map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 4. VERIFIED LAGOS PROJECT GALLERY CAROUSEL */}
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                Live Work Showcase
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1">
                Verified Lagos Project Gallery
              </h2>
              <p className="text-base text-slate-600 mt-1.5 max-w-2xl">
                Real photographed handovers across Ikoyi, Victoria Island, Lekki, and Ikeja
                GRA—inspect scopes before requesting a quote.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollHorizontal(galleryTrackRef, 'prev')}
                aria-label="Previous completed project"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-[#0F766E] hover:text-[#0F766E] hover:shadow-sm flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollHorizontal(galleryTrackRef, 'next')}
                aria-label="Next completed project"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-[#0F766E] hover:text-[#0F766E] hover:shadow-sm flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={galleryTrackRef}
            className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 -mx-1 px-1"
          >
            {PROJECT_GALLERY.map((item) => (
              <Link
                key={item.id}
                href={`/providers/${item.providerId}`}
                className="group glow-card snap-start shrink-0 w-[300px] sm:w-[360px] rounded-2xl overflow-hidden border border-slate-200/90 bg-white hover:-translate-y-1.5 hover:border-[#0F766E]/50"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <SmartImage
                    src={item.image}
                    alt={`${item.title} in ${item.location}`}
                    fill
                    sizes="(max-width: 640px) 300px, 360px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
                  <div className="absolute top-3.5 right-3.5 w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md text-[#0F172A] group-hover:bg-[#0F766E] group-hover:text-white flex items-center justify-center shadow-md transition-colors">
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="absolute bottom-3.5 left-4 right-4 text-white">
                    <p className="text-[11px] font-semibold text-amber-300">
                      {item.category} · {item.location}
                    </p>
                    <h3 className="text-base font-bold leading-snug mt-0.5 line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0F172A] truncate">
                      {item.providerName}
                    </p>
                    <p className="text-slate-500 mt-0.5">{item.timeline}</p>
                  </div>
                  <span className="font-bold text-[#0F766E] tabular-nums shrink-0">
                    {item.value}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS + INTERACTIVE CLIENT OUTCOMES CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              How SkillNext protects every booking
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Every step is built around accountability—verifying real identities, real
              past projects, and clear written scope before work begins.
            </p>
            <div className="space-y-4 pt-2">
              {[
                {
                  title: '01. Search verified talent or post a brief',
                  body: 'Filter by Lagos neighborhood, starting Naira rate, rating, and NIN/CAC verification status—or publish a service request in under two minutes.',
                },
                {
                  title: '02. Inspect portfolios and message directly',
                  body: 'Review completed local builds, ask technical questions, and agree on milestone deliverables inside a documented inquiry thread.',
                },
                {
                  title: '03. Hire with confidence and leave an audited review',
                  body: "After project completion, your rating updates the provider's public trust record to guide future clients across Nigeria.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="glow-card p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#0F766E]/45"
                >
                  <h3 className="text-base font-semibold text-[#0F172A]">{step.title}</h3>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/how-it-works"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E] hover:text-[#0D5E58]"
            >
              Read our vetting & safety standards
              <ArrowRight
                className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A]">
                  Verified client outcomes in Lagos
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  Case {testimonialIndex + 1} of {TESTIMONIALS.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTestimonialIndex(
                      (i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
                    )
                  }
                  aria-label="Previous testimonial"
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:border-[#0F766E] hover:text-[#0F766E] flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length)
                  }
                  aria-label="Next testimonial"
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:border-[#0F766E] hover:text-[#0F766E] flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.blockquote
                key={activeTestimonial.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="glow-card bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 space-y-5 shadow-xs"
              >
                <p className="text-xs font-semibold text-[#0F766E]">
                  {activeTestimonial.project}
                </p>
                <p className="text-base sm:text-lg text-[#0F172A] leading-relaxed font-medium">
                  &ldquo;{activeTestimonial.quote}&rdquo;
                </p>
                <footer className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div>
                    <span className="font-semibold text-[#0F172A]">
                      {activeTestimonial.name}
                    </span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>{activeTestimonial.role}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[#0F766E] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {activeTestimonial.location}
                  </span>
                </footer>
              </motion.blockquote>
            </AnimatePresence>

            {/* Quick selector strip for other outcomes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TESTIMONIALS.map((item, idx) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setTestimonialIndex(idx)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 ${
                    idx === testimonialIndex
                      ? 'bg-white border-[#0F766E] shadow-[0_10px_24px_-12px_rgba(15,118,110,0.3)]'
                      : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-semibold text-[#0F172A] truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.location}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONVERSION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative overflow-hidden bg-[#0F172A] rounded-2xl p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-radial from-[#0F766E]/35 via-[#D4A017]/15 to-transparent blur-2xl"
          />
          <div className="relative max-w-2xl space-y-3">
            <p className="text-sm font-medium text-[#D4A017]">
              Ready to get started on SkillNext?
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
              Book a vetted Lagos professional today, or list your craft for free.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Clients browse and message at zero cost. Providers keep 100% of direct
              service agreements with optional verification and featured placement.
            </p>
          </div>
          <div className="relative flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/browse"
              className="px-6 py-3 bg-[#0F766E] hover:bg-[#14B8A6] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-8px_rgba(20,184,166,0.45)] whitespace-nowrap"
            >
              Find a Pro
            </Link>
            <Link
              href="/signup?role=provider"
              className="px-6 py-3 bg-white hover:bg-slate-100 text-[#0F172A] text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
            >
              Become a Provider
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
