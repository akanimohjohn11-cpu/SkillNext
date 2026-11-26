'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { GENERATED_IMAGES, SEED_CATEGORIES } from '@/lib/constants';
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
    <header className="sticky top-0 z-40 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_18px_-8px_rgba(15,23,42,0.12)]">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* Zone 1: Custom Image Logo Mark + Styled SkillNext Wordmark */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
        >
          <span className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-[#D4A017]/45 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_-3px_rgba(15,118,110,0.45)]">
            <Image
              src={GENERATED_IMAGES.logo}
              alt="SkillNext emblem"
              width={36}
              height={36}
              priority
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </span>
          <span className="font-display text-[22px] leading-none tracking-[-0.03em] select-none flex items-baseline">
            <span className="font-bold text-[#0F172A]">Skill</span>
            <span className="font-semibold text-[#0F766E] ml-[1px] relative">
              Next
              <span
                aria-hidden="true"
                className="block h-[2.5px] w-full bg-gradient-to-r from-[#0F766E] via-[#D4A017] to-[#D4A017] rounded-full mt-[1px] origin-left scale-x-75 group-hover:scale-x-100 transition-transform duration-200"
              />
            </span>
          </span>
        </Link>

        {/* Zone 2: Clean single-line nav links + modern Categories Drawdown */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <Link
            href="/browse"
            className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors duration-150 ${
              pathname === '/browse'
                ? 'text-[#0F172A] border-[#0F766E]'
                : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
            }`}
          >
            Browse Pros
          </Link>

          {/* Desktop Categories Drawdown Trigger & Panel */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCatMenuOpen((o) => !o)}
              aria-expanded={catMenuOpen}
              className={`group inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                pathname.startsWith('/category') || catMenuOpen
                  ? 'bg-[#0F766E]/8 text-[#0F172A] border-[#0F766E]/35 shadow-[0_0_20px_-6px_rgba(15,118,110,0.3)]'
                  : 'bg-slate-50/80 border-slate-200/80 text-slate-700 hover:bg-white hover:text-[#0F172A] hover:border-[#0F766E]/40 hover:shadow-[0_6px_18px_-8px_rgba(15,118,110,0.28)]'
              }`}
            >
              <span>Categories</span>
              <span className="w-5 h-5 rounded-md bg-white border border-slate-200/90 flex items-center justify-center shadow-2xs group-hover:border-[#0F766E]/35 transition-colors">
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#0F766E] transition-transform duration-200 ${
                    catMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>

            <AnimatePresence>
              {catMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full mt-3 w-[560px] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_24px_60px_-15px_rgba(15,23,42,0.22)] p-4 z-50"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                      <span className="text-xs font-semibold text-slate-600">
                        Verified Nigerian Service Sectors
                      </span>
                    </div>
                    <Link
                      href="/browse"
                      onClick={() => setCatMenuOpen(false)}
                      className="text-xs font-semibold text-[#0F766E] hover:text-[#0D5E58] inline-flex items-center gap-1"
                    >
                      All 13 categories
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SEED_CATEGORIES.slice(0, 8).map((cat, idx) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.16, delay: idx * 0.02 }}
                      >
                        <Link
                          href={`/category/${cat.slug}`}
                          onClick={() => setCatMenuOpen(false)}
                          className="group flex items-center gap-3 p-2.5 rounded-xl bg-white hover:bg-gradient-to-r hover:from-teal-50/70 hover:to-amber-50/40 border border-transparent hover:border-[#0F766E]/25 hover:shadow-[0_10px_24px_-14px_rgba(15,118,110,0.35)] transition-all duration-150"
                        >
                          <span className="w-9 h-9 rounded-lg bg-[#F1F5F9] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-150 group-hover:scale-105">
                            <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0F766E] truncate">
                              {cat.name}
                            </p>
                            <p className="text-[11px] text-slate-500 tabular-nums">
                              {cat.providerCount} verified pros
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Looking for vetted engineers, solar or legal specialists?</span>
                    <Link
                      href="/signup?role=provider"
                      onClick={() => setCatMenuOpen(false)}
                      className="font-semibold text-[#0F766E] hover:underline whitespace-nowrap"
                    >
                      Join SkillNext →
                    </Link>
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
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors duration-150 ${
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
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0D5E58] rounded-xl shadow-xs hover:shadow-[0_10px_24px_-8px_rgba(15,118,110,0.55)] transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0D5E58] rounded-xl shadow-xs hover:shadow-[0_10px_24px_-8px_rgba(15,118,110,0.55)] transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Modern Sleek Mobile Drawdown Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          className={`md:hidden group relative inline-flex items-center gap-2.5 h-10 pl-3 pr-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
            mobileOpen
              ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[0_12px_28px_-10px_rgba(15,23,42,0.55)]'
              : 'bg-white/95 text-[#0F172A] border-slate-200 hover:border-[#0F766E]/60 shadow-xs hover:shadow-[0_8px_22px_-10px_rgba(15,118,110,0.38)]'
          }`}
        >
          <span>{mobileOpen ? 'Close' : 'Menu'}</span>
          <span
            className={`w-6 h-6 rounded-lg flex flex-col items-center justify-center gap-[4px] transition-colors ${
              mobileOpen
                ? 'bg-white/10'
                : 'bg-[#F1F5F9] group-hover:bg-[#0F766E]/10'
            }`}
            aria-hidden="true"
          >
            <span
              className={`block h-[1.75px] rounded-full transition-all duration-200 ${
                mobileOpen
                  ? 'w-3.5 bg-amber-300 rotate-45 translate-y-[2.8px]'
                  : 'w-3.5 bg-[#0F766E]'
              }`}
            />
            <span
              className={`block h-[1.75px] rounded-full transition-all duration-200 ${
                mobileOpen
                  ? 'w-3.5 bg-amber-300 -rotate-45 -translate-y-[2.8px]'
                  : 'w-2.5 bg-[#0F172A] self-end mr-[5px] group-hover:w-3.5 group-hover:mr-0'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Modern Glassmorphic Mobile Drawdown Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-white/98 backdrop-blur-xl border-b border-slate-200 px-4 py-5 space-y-4 shadow-2xl"
          >
            <nav className="grid grid-cols-1 gap-1.5" aria-label="Mobile navigation">
              {[
                { href: '/browse', label: 'Browse Professionals' },
                { href: '/category/construction', label: 'Explore Categories' },
                { href: '/how-it-works', label: 'How SkillNext Works' },
                { href: '/pricing', label: 'Pricing & Plans' },
                { href: '/about', label: 'About SkillNext' },
                { href: '/contact', label: 'Contact Lagos Desk' },
              ].map((item, idx) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.025 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#0F172A] hover:bg-teal-50/70 hover:text-[#0F766E] transition-colors"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
              {user ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-[#0F766E] rounded-xl"
                  >
                    Open Dashboard ({user.fullName})
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-4 text-center text-sm font-medium text-slate-700 bg-slate-100 rounded-xl"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-[#0F766E] rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 px-4 text-center text-sm font-semibold text-[#0F172A] border border-slate-300 rounded-xl"
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
