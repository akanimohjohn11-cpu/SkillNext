import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | SkillNext Nigeria',
  description: 'Terms governing use of the SkillNext Nigerian professional marketplace.',
};

export default function TermsPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 space-y-6">
        <div className="space-y-2 pb-6 border-b border-slate-200">
          <Link href="/legal" className="text-xs font-semibold text-[#0F766E] hover:underline">
            ← Legal Hub
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500">Effective Date: November 2026 · Lagos, Nigeria</p>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-[#0F172A]">1. Marketplace Role</h2>
          <p>
            SkillNext Nigeria Limited operates a verified directory and communication
            platform connecting clients with independent service providers. While we
            manually screen identity documents (NIN/Passport) and corporate filings (CAC)
            before issuing Verified badges, direct contracts for services are formed
            between Client and Provider.
          </p>

          <h2 className="text-base font-bold text-[#0F172A]">2. Accurate Listings & Quotes</h2>
          <p>
            Providers must publish truthful experience, authentic project photographs, and
            clear starting fees in Nigerian Naira (₦). Bait-and-switch pricing or
            impersonation leads to immediate suspension.
          </p>

          <h2 className="text-base font-bold text-[#0F172A]">3. Reviews & Moderation</h2>
          <p>
            Clients may only submit reviews reflecting genuine inquiries or completed
            projects. SkillNext reserves the right to hide defamatory, fabricated, or
            abusive submissions.
          </p>

          <h2 className="text-base font-bold text-[#0F172A]">4. Governing Law</h2>
          <p>
            These terms are governed by the laws of the Federal Republic of Nigeria, with
            disputes subject to Lagos State jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}
