'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { LAGOS_LOCATIONS, SEED_CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'provider' ? 'provider' : 'client';
  const nextUrl = searchParams.get('next');
  const { refreshSession } = useAuth();

  const [role, setRole] = useState<'client' | 'provider'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+234 ');
  const [location, setLocation] = useState('Victoria Island, Lagos');
  const [password, setPassword] = useState('');

  // Provider-only onboarding fields
  const [businessName, setBusinessName] = useState('');
  const [categorySlug, setCategorySlug] = useState(SEED_CATEGORIES[0].slug);
  const [headline, setHeadline] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'SkillNestClient',
        },
        body: JSON.stringify({
          action: 'signup',
          fullName,
          email,
          phone,
          password,
          role,
          location,
          businessName: role === 'provider' ? businessName : undefined,
          categorySlug: role === 'provider' ? categorySlug : undefined,
          headline: role === 'provider' ? headline : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not create account');
      } else if (data.needsEmailConfirmation) {
        setNotice(
          'Account created! Please check your email inbox to confirm your SkillNest address before signing in.'
        );
      } else {
        await refreshSession();
        if (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//')) {
          router.push(nextUrl);
        } else {
          router.push(role === 'provider' ? '/dashboard/provider' : '/dashboard/client');
        }
        router.refresh();
      }
    } catch {
      setError('Network error while creating your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg w-full mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Create your SkillNest account
        </h1>
        <p className="text-sm text-slate-600">
          {role === 'client'
            ? 'Browse verified pros, post service requests, and track quotes free.'
            : 'Launch your verified Nigerian practice profile and receive direct client leads.'}
        </p>
      </div>

      {/* Separate Client vs Provider Flow Switch */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F5F9] rounded-lg">
        <button
          type="button"
          onClick={() => setRole('client')}
          className={`py-2.5 text-xs font-semibold rounded-md transition-colors ${
            role === 'client'
              ? 'bg-white text-[#0F172A] shadow-sm'
              : 'text-slate-600 hover:text-[#0F172A]'
          }`}
        >
          I want to Hire a Pro
        </button>
        <button
          type="button"
          onClick={() => setRole('provider')}
          className={`py-2.5 text-xs font-semibold rounded-md transition-colors ${
            role === 'provider'
              ? 'bg-white text-[#0F172A] shadow-sm'
              : 'text-slate-600 hover:text-[#0F172A]'
          }`}
        >
          I am a Service Provider
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adewale Johnson"
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 803 000 0000"
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.ng"
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Primary Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
            >
              {LAGOS_LOCATIONS.filter((l) => l !== 'All Lagos & Nigeria').map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {role === 'provider' && (
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Studio / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Eko Precision Works"
                  className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Primary Category
                </label>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                >
                  {SEED_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., Certified Hybrid Solar & Inverter Engineer"
                className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Password (minimum 6 characters)
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password"
            className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-xs font-medium text-[#0F766E] bg-teal-50 border border-teal-200 rounded-lg p-2.5">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting
            ? 'Creating Account...'
            : role === 'provider'
              ? 'Launch Provider Account'
              : 'Create Free Client Account'}
        </button>
      </form>

      <p className="text-xs text-slate-500 text-center">
        By signing up you agree to our{' '}
        <Link href="/legal/terms" className="underline hover:text-[#0F172A]">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/legal/privacy" className="underline hover:text-[#0F172A]">
          NDPR Privacy Policy
        </Link>
        .
      </p>

      <p className="text-xs text-center text-slate-600 pt-1 border-t border-slate-100">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-[#0F766E] hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-[82vh] py-14 px-4 sm:px-6">
      <Suspense fallback={<div className="max-w-lg mx-auto h-[520px] bg-white rounded-2xl border border-slate-200 animate-pulse" />}>
        <SignupFormContent />
      </Suspense>
    </div>
  );
}
