import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileCheck2, MessageSquare, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How SkillNest Works | Vetted Nigerian Professionals',
  description:
    'Learn how SkillNest verifies identities, screens portfolios, and connects clients in Lagos and Nigeria with trusted specialists.',
};

export default function HowItWorksPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <p className="text-sm font-semibold text-[#0F766E]">Trust Architecture</p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] mt-2 text-balance">
            How SkillNest connects craft with accountability
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 max-w-2xl leading-relaxed">
            Whether you are renovating a residence in Ikoyi, deploying commercial solar in
            Lekki, or registering a company in Abuja, every engagement follows a
            structured, transparent workflow.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        {/* For Clients */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">For Clients Hiring Talent</h2>
              <p className="text-sm text-slate-600 mt-1">
                Zero marketplace fees for browsing, posting requests, and comparing quotes.
              </p>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:underline whitespace-nowrap"
            >
              Browse Verified Pros
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <p className="text-xs font-semibold text-[#0F766E] tabular-nums">Step 01</p>
              <h3 className="text-lg font-semibold text-[#0F172A]">
                Filter by craft & neighborhood
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Search across 13 Nigerian categories and narrow by Lagos LGA, verified
                status, client ratings, and starting Naira rate.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <p className="text-xs font-semibold text-[#0F766E] tabular-nums">Step 02</p>
              <h3 className="text-lg font-semibold text-[#0F172A]">
                Send a structured brief
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Message providers directly from their profile or post a Service Request to
                collect itemized quotes and availability dates.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <p className="text-xs font-semibold text-[#0F766E] tabular-nums">Step 03</p>
              <h3 className="text-lg font-semibold text-[#0F172A]">
                Complete & publish review
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Keep milestone agreements inside your inquiry thread and publish an audited
                rating once delivery meets your standard.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Standards */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-bold text-[#0F172A]">
              Our Three-Point Verification Standard
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Before a provider receives the gold-and-teal Verified badge, our Lagos trust
              team manually inspects three independent signals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <ShieldCheck className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              <h3 className="text-base font-semibold text-[#0F172A]">
                01. Government Identity (NIN)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every lead practitioner submits a valid NIN, International Passport, or
                Driver&apos;s License matched against their profile portrait.
              </p>
            </div>
            <div className="space-y-2">
              <FileCheck2 className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              <h3 className="text-base font-semibold text-[#0F172A]">
                02. CAC & Trade Credentials
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Registered studios provide CAC RC/BN numbers alongside sector licenses
                where applicable (ARCON, COREN, NBA, NEMSA, ICAN).
              </p>
            </div>
            <div className="space-y-2">
              <MessageSquare className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              <h3 className="text-base font-semibold text-[#0F172A]">
                03. Documented Portfolio Proof
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Unedited project photos, Lagos site locations, and verifiable client
                references ensure portfolios reflect real delivered work.
              </p>
            </div>
          </div>
        </div>

        {/* For Providers CTA */}
        <div className="bg-[#0F172A] rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl font-bold text-white">
              Are you a skilled Nigerian professional?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Build your verified SkillNest profile, showcase past builds, publish clear
              Naira starting rates, and win high-intent Lagos clients.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" aria-hidden="true" />
                Free MVP launch listing
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" aria-hidden="true" />
                Zero commission on quotes
              </span>
            </div>
          </div>
          <Link
            href="/signup?role=provider"
            className="px-6 py-3 bg-[#0F766E] hover:bg-[#14B8A6] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 self-start md:self-center"
          >
            Create Provider Profile
          </Link>
        </div>
      </section>
    </div>
  );
}
