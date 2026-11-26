import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing & Plans | SkillNest Nigeria',
  description:
    'Free for Nigerian clients and free MVP provider onboarding, plus Pro and Studio plans for growing teams.',
};

const PLANS = [
  {
    name: 'Client & Starter Pro',
    audience: 'For clients hiring & solo practitioners launching',
    price: '₦0',
    cadence: 'Free during MVP',
    ctaLabel: 'Get Started Free',
    ctaHref: '/signup',
    highlighted: false,
    limits: [
      'Unlimited client browsing, saved pros & service requests',
      '1 active provider profile with up to 4 service packages',
      'Up to 6 portfolio project uploads',
      'Standard NIN identity verification review',
      '0% commission on direct project agreements',
    ],
  },
  {
    name: 'Verified Pro',
    audience: 'For established independent specialists',
    price: '₦12,500',
    cadence: 'per month (planned post-MVP)',
    ctaLabel: 'Join as Verified Pro',
    ctaHref: '/signup?role=provider',
    highlighted: true,
    limits: [
      'Priority ranking in Lagos neighborhood searches',
      'Unlimited service packages & 25 portfolio showcases',
      'Expedited 24-hour NIN + CAC verification badge',
      'Direct access to open Client Service Requests',
      'Profile analytics & quote conversion insights',
    ],
  },
  {
    name: 'Studio & Agency',
    audience: 'For multi-specialist firms & contractors',
    price: '₦35,000',
    cadence: 'per month (planned post-MVP)',
    ctaLabel: 'Contact Sales',
    ctaHref: '/contact',
    highlighted: false,
    limits: [
      'Featured homepage carousel rotation eligibility',
      'Up to 5 team member seats under one studio brand',
      'Unlimited portfolio galleries & high-res media',
      'Dedicated Lagos account verification specialist',
      'Corporate invoicing & multi-location LGA coverage',
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="text-sm font-semibold text-[#0F766E]">Transparent Plans</p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] mt-2 text-balance">
            Free to hire. Simple plans as your practice scales.
          </h1>
          <p className="text-base text-slate-600 mt-4 max-w-2xl mx-auto leading-relaxed">
            Clients never pay to browse, post briefs, or message providers. During our
            Lagos launch phase, core provider profiles and verification are free.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 flex flex-col justify-between gap-8 border ${
                plan.highlighted
                  ? 'bg-[#0F172A] text-white border-[#0F172A]'
                  : 'bg-white text-[#0F172A] border-slate-200'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  <p
                    className={`text-sm mt-1 ${
                      plan.highlighted ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {plan.audience}
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-4xl font-bold tabular-nums">{plan.price}</span>
                  <span
                    className={`block text-xs mt-1 ${
                      plan.highlighted ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {plan.cadence}
                  </span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-200/20 text-sm">
                  {plan.limits.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.highlighted ? 'text-[#D4A017]' : 'text-[#0F766E]'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={
                          plan.highlighted ? 'text-slate-200' : 'text-slate-700'
                        }
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.ctaHref}
                className={`block w-full py-3 px-4 text-center text-sm font-semibold rounded-lg transition-colors ${
                  plan.highlighted
                    ? 'bg-[#0F766E] hover:bg-[#14B8A6] text-white'
                    : 'bg-[#0F172A] hover:bg-slate-800 text-white'
                }`}
              >
                {plan.ctaLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
