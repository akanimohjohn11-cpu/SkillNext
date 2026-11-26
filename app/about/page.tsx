import type { Metadata } from 'next';
import Link from 'next/link';
import { GENERATED_IMAGES } from '@/lib/constants';
import { SmartImage } from '@/components/SmartImage';

export const metadata: Metadata = {
  title: 'About SkillNest | Raising the Standard for Services in Nigeria',
  description:
    'SkillNest was built in Victoria Island, Lagos to replace guesswork and WhatsApp hearsay with verified Nigerian craftsmanship.',
};

export default function AboutPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-sm font-semibold text-[#0F766E]">About SkillNest</p>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] text-balance">
              Replacing guesswork with verified Nigerian craftsmanship.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Finding a reliable architect, solar engineer, or corporate counsel in Lagos
              should not depend on luck or unverified group-chat referrals. SkillNest
              organizes Nigeria&apos;s finest independent practitioners into a single
              trust-anchored directory.
            </p>
          </div>
          <div className="lg:col-span-6 relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <SmartImage
              src={GENERATED_IMAGES.residencePortfolio}
              alt="Modern Lagos architectural interior completed by SkillNest vetted professionals"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#0F172A]">Transparent Naira Pricing</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every service listing states clear starting fees in Naira and expected
              turnaround times, removing hidden surcharges before an inquiry even starts.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#0F172A]">Built for Lagos & Diaspora</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Whether you live in Lekki Phase 1 or coordinate family projects from abroad,
              documented inquiry threads and verified reviews protect every decision.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#0F172A]">Dignity for Master Craft</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Talented Nigerian engineers, designers, and artisans deserve a polished
              storefront that wins serious clients based on merit rather than ad spend.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-[#0F172A]">
              Explore professionals or join the directory
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Operating across Lagos Island, Lagos Mainland, Abuja FCT, and Port Harcourt.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/browse"
              className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Find a Pro
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-[#0F172A] text-sm font-semibold rounded-lg transition-colors"
            >
              Contact Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
