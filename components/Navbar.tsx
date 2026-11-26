'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
  Compass,
  LayoutGrid,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { SEED_CATEGORIES } from '@/lib/constants';
import { CategoryIcon } from '@/components/CategoryIcon';

const NAV_LINKS = [
  { href: '/browse', label: 'Browse Pros' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dashboardHref =
    user?.role === 'provider'
      ? '/dashboard/provider'
      : user?.role === 'admin'
        ? '/dashboard/admin'
        : '/dashboard/client';

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSignOut = async () => {
    await logout();
    setMobileOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Precision Geometric Emblem + Styled SkillNest Wordmark */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
        >
          <span className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#0B534D] text-white flex items-center justify-center shadow-sm ring-1 ring-[#D4A017]/40 transition-transform duration-200 group-hover:scale-105">
            <Compass className="w-[18px] h-[18px] text-amber-200 transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
          </span>
          <span className="font-display text-[22px] leading-none tracking-[-0.03em] select-none flex items-baseline">
            <span className="font-bold text-[#0F172A]">Skill</span>
            <span className="font-semibold italic text-[#0F766E] ml-[1px] relative">
              Nest
              <span
                aria-hidden="true"
                className="block h-[2px] w-full bg-[#D4A017] rounded-full mt-[1px] origin-left scale-x-75 group-hover:scale-x-100 transition-transform duration-200"
              />
            </span>
          </span>
        </Link>

        {/* Zone 2: Clean single-line nav links + sleek Categories Drawdown */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <Link
            href="/browse"
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
              pathname === '/browse'
                ? 'text-[#0F172A] border-[#0F766E]'
                : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
            }`}
          >
            Browse Pros
          </Link>

          {/* Desktop Categories Drawdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCatMenuOpen((o) => !o)}
              aria-expanded={catMenuOpen}
              className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
                pathname.startsWith('/category') || catMenuOpen
                  ? 'text-[#0F172A] border-[#0F766E]'
                  : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
              }`}
            >
              Categories
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  catMenuOpen ? 'rotate-180 text-[#0F766E]' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence>
              {catMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full mt-3 w-[520px] bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">
                      Popular Nigerian Sectors
                    </span>
                    <Link
                      href="/browse"
                      onClick={() => setCatMenuOpen(false)}
                      className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1"
                    >
                      All 13 categories
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SEED_CATEGORIES.slice(0, 8).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        onClick={() => setCatMenuOpen(false)}
                        className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-slate-200 transition-all duration-150"
                      >
                        <span className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                          <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0F766E] truncate">
                            {cat.name}
                          </p>
                          <p className="text-[11px] text-slate-500 tabular-nums">
                            {cat.providerCount} verified pros
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {NAV_LINKS.slice(1).map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
                  active
                    ? 'text-[#0F172A] border-[#0F766E]'
                    : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="hidden md:flex items-center shrink-0">
          {user ? (
            <Link
              href={dashboardHref}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0D5E58] rounded-lg shadow-xs hover:shadow transition-all duration-150 whitespace-nowrap shrink-0"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0D5E58] rounded-lg shadow-xs hover:shadow transition-all duration-150 whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Polished Mobile Drawdown Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          className={`md:hidden inline-flex items-center gap-2 h-10 px-3 rounded-xl border text-xs font-semibold transition-all duration-150 ${
            mobileOpen
              ? 'bg-[#0F172A] text-white border-[#0F172A]'
              : 'bg-white text-[#0F172A] border-slate-200 hover:border-[#0F766E] shadow-xs'
          }`}
        >
          {mobileOpen ? (
            <>
              <X className="w-4 h-4" aria-hidden="true" />
              <span>Close</span>
            </>
          ) : (
            <>
              <LayoutGrid className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
              <span>Menu</span>
            </>
          )}
        </button>
      </div>

      {/* Animated Mobile Drawdown Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-white border-b border-slate-200 px-4 py-5 space-y-4 shadow-xl"
          >
            <nav className="grid grid-cols-1 gap-1" aria-label="Mobile navigation">
              {[
                { href: '/browse', label: 'Browse Professionals' },
                { href: '/category/construction', label: 'Explore Categories' },
                { href: '/how-it-works', label: 'How SkillNest Works' },
                { href: '/pricing', label: 'Pricing & Plans' },
                { href: '/about', label: 'About SkillNest' },
                { href: '/contact', label: 'Contact Lagos Desk' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-colors"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                </Link>
              ))}
              <Link
                href="/dashboard/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4A017]" aria-hidden="true" />
                  Admin Console
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
              {user ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-[#0F766E] rounded-lg"
                  >
                    Open Dashboard ({user.fullName})
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-4 text-center text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-[#0F766E] rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 px-4 text-center text-sm font-semibold text-[#0F172A] border border-slate-300 rounded-lg"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
