'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { UserRole } from '@/types';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');
  const { refreshSession, switchPreviewRole, supabaseConfigured } = useAuth();

  const [roleTab, setRoleTab] = useState<'client' | 'provider'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigateAfterAuth = (role: UserRole) => {
    if (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//')) {
      router.push(nextUrl);
    } else if (role === 'provider') {
      router.push('/dashboard/provider');
    } else if (role === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/client');
    }
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'SkillNestClient',
        },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to sign in');
      } else {
        await refreshSession();
        navigateAfterAuth(data.user.role);
      }
    } catch {
      setError('Network error while signing in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewSignIn = async (role: UserRole) => {
    setError('');
    setSubmitting(true);
    try {
      const user = await switchPreviewRole(role);
      if (user) {
        navigateAfterAuth(user.role);
      } else {
        setError('Preview sign-in is disabled when Supabase production auth is active.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Sign in to SkillNext
        </h1>
        <p className="text-sm text-slate-600">
          Access your messages, service requests, and verified provider workspace.
        </p>
      </div>

      {/* Role flow segmented control */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F5F9] rounded-lg">
        <button
          type="button"
          onClick={() => setRoleTab('client')}
          className={`py-2 text-xs font-semibold rounded-md transition-colors ${
            roleTab === 'client'
              ? 'bg-white text-[#0F172A] shadow-sm'
              : 'text-slate-600 hover:text-[#0F172A]'
          }`}
        >
          Client Account
        </button>
        <button
          type="button"
          onClick={() => setRoleTab('provider')}
          className={`py-2 text-xs font-semibold rounded-md transition-colors ${
            roleTab === 'provider'
              ? 'bg-white text-[#0F172A] shadow-sm'
              : 'text-slate-600 hover:text-[#0F172A]'
          }`}
        >
          Provider Studio
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              roleTab === 'provider'
                ? 'amara.okafor@skillnext.ng'
                : 'tunde.balogun@skillnext.ng'
            }
            className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Signing in...' : `Sign In as ${roleTab === 'provider' ? 'Provider' : 'Client'}`}
        </button>
      </form>

      {!supabaseConfigured && (
        <div className="pt-4 border-t border-slate-200 space-y-2.5">
          <p className="text-xs font-medium text-slate-500">
            Instant workspace preview (local mode before Supabase env setup):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handlePreviewSignIn('client')}
              className="py-2 px-3 text-xs font-medium bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 rounded-lg text-[#0F172A] transition-colors"
            >
              Client Demo
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handlePreviewSignIn('provider')}
              className="py-2 px-3 text-xs font-medium bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 rounded-lg text-[#0F172A] transition-colors"
            >
              Provider Demo
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 text-xs text-center text-slate-600">
        <p>
          New to SkillNext?{' '}
          <Link
            href={`/signup?role=${roleTab}${nextUrl ? `&next=${encodeURIComponent(nextUrl)}` : ''}`}
            className="font-semibold text-[#0F766E] hover:underline"
          >
            Create a {roleTab === 'provider' ? 'Provider' : 'Client'} account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-[82vh] py-14 px-4 sm:px-6">
      <Suspense fallback={<div className="max-w-md mx-auto h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
