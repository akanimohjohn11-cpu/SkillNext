import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trust, Legal & Provider Code of Conduct | SkillNest Nigeria',
  description:
    'SkillNest Nigeria legal hub, Provider Code of Conduct, NDPR Privacy Policy, and marketplace Terms of Service.',
};

export default function LegalIndexPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <p className="text-sm font-semibold text-[#0F766E]">Trust & Governance</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] mt-2">
            SkillNest Legal & Code of Conduct
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Governing marketplace integrity for clients and practitioners across Nigeria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/legal/terms"
            className="bg-white border border-slate-200 hover:border-[#0F766E] rounded-xl p-6 transition-colors"
          >
            <h2 className="text-lg font-semibold text-[#0F172A]">Terms of Service</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Rules governing marketplace accounts, quotes, inquiries, and dispute
              resolution under Nigerian law.
            </p>
          </Link>
          <Link
            href="/legal/privacy"
            className="bg-white border border-slate-200 hover:border-[#0F766E] rounded-xl p-6 transition-colors"
          >
            <h2 className="text-lg font-semibold text-[#0F172A]">
              Privacy Policy (NDPR)
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              How we protect identity verification documents, messages, and contact
              details under the Nigeria Data Protection Act.
            </p>
          </Link>
        </div>

        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-[#0F172A]">
            Provider Code of Conduct
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Every verified practitioner on SkillNest commits to accurate portfolio
            representation, written milestone pricing prior to mobilization, punctual site
            attendance across Lagos, and respectful communication. Misrepresentation of
            NIN, CAC, or client work results in immediate permanent removal.
          </p>
        </section>
      </div>
    </div>
  );
}
