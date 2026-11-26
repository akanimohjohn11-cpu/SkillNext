import Image from 'next/image';
import Link from 'next/link';
import { GENERATED_IMAGES } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          <div className="space-y-3">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-[#D4A017]/50 transition-transform duration-200 group-hover:scale-105">
                <Image
                  src={GENERATED_IMAGES.logo}
                  alt="SkillNext emblem"
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </span>
              <span className="font-display text-xl tracking-[-0.03em] flex items-baseline">
                <span className="font-bold text-white">Skill</span>
                <span className="font-semibold text-[#14B8A6] ml-[1px]">Next</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Connecting discerning clients in Lagos and across Nigeria with identity-verified
              professionals, engineers, designers, and master tradespeople.
            </p>
            <p className="text-xs text-slate-400 pt-1">
              14 Adeola Odeku Street, Victoria Island, Lagos
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Marketplace</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/browse" className="hover:text-white transition-colors">
                  Find a Professional
                </Link>
              </li>
              <li>
                <Link href="/category/construction" className="hover:text-white transition-colors">
                  Construction & Architecture
                </Link>
              </li>
              <li>
                <Link href="/category/home-services" className="hover:text-white transition-colors">
                  Home Services & Solar
                </Link>
              </li>
              <li>
                <Link href="/category/technology" className="hover:text-white transition-colors">
                  Technology & Engineering
                </Link>
              </li>
              <li>
                <Link href="/signup?role=provider" className="hover:text-white transition-colors">
                  Become a Provider
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How SkillNext Works
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us & Vetting
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Lagos Support
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Member Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Trust & Governance</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/legal/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                  Privacy Policy (NDPR)
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-white transition-colors">
                  Provider Code of Conduct
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Client & Provider Sign In
                </Link>
              </li>
              <li>
                <Link href="/dashboard/admin" className="text-amber-300/90 hover:text-amber-200 transition-colors">
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} SkillNext Nigeria Limited. All rights reserved.</p>
          <p>Built for verified craftsmanship in Lagos, Abuja & Port Harcourt.</p>
        </div>
      </div>
    </footer>
  );
}
