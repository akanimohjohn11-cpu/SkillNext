import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy (NDPR) | SkillNext Nigeria',
  description:
    'SkillNext Nigeria Data Protection Regulation (NDPR) and NDPA privacy compliance policy.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 space-y-6">
        <div className="space-y-2 pb-6 border-b border-slate-200">
          <Link href="/legal" className="text-xs font-semibold text-[#0F766E] hover:underline">
            ← Legal Hub
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">
            Privacy Policy (NDPA / NDPR)
          </h1>
          <p className="text-xs text-slate-500">Effective Date: November 2026 · Lagos, Nigeria</p>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-[#0F172A]">1. Data We Collect</h2>
          <p>
            We collect your name, email address, phone number, Lagos/Nigerian neighborhood,
            project briefs, and—for providers—portfolio media and verification identifiers
            (last 4 digits of NIN/ID and CAC registration numbers).
          </p>

          <h2 className="text-base font-bold text-[#0F172A]">2. How Verification Data Is Stored</h2>
          <p>
            Verification records are stored in access-controlled Supabase buckets and
            databases protected by Row Level Security (RLS). Sensitive ID records are
            never displayed publicly; only your verified status badge appears on your
            profile.
          </p>

          <h2 className="text-base font-bold text-[#0F172A]">3. Your Rights</h2>
          <p>
            Under the Nigeria Data Protection Act (NDPA), you may request export,
            correction, or deletion of your account data at any time via{' '}
            <Link href="/contact" className="text-[#0F766E] underline">
              Lagos Support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
