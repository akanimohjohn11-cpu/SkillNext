'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  FolderKanban,
  MessageSquareWarning,
  ShieldAlert,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { DashboardShell } from '@/components/DashboardShell';
import {
  Category,
  ProviderProfile,
  Review,
  UserProfile,
  VerificationSubmission,
} from '@/types';

interface AdminReviewRow extends Review {
  providerName: string;
  providerBusiness: string;
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState('verifications');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [verifications, setVerifications] = useState<VerificationSubmission[]>([]);
  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [inquiriesCount, setInquiriesCount] = useState(0);

  // Add category form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  // Admin passcode gate state
  const [gateChecked, setGateChecked] = useState(false);
  const [envConfigured, setEnvConfigured] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeSubmitting, setPasscodeSubmitting] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');

  const [loaded, setLoaded] = useState(false);

  const loadAdminData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
        setProviders(d.providers || []);
        setCategories(d.categories || []);
        setVerifications(d.verifications || []);
        setReviews(d.reviews || []);
        setInquiriesCount(d.inquiriesCount || 0);
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/auth', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!active || !d) return;
        setEnvConfigured(Boolean(d.envConfigured));
        setIsClaimed(Boolean(d.isClaimed));
      })
      .finally(() => {
        if (active) setGateChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading || user?.role !== 'admin') return;
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin', { cache: 'no-store' });
        if (active && res.ok) {
          const d = await res.json();
          setUsers(d.users || []);
          setProviders(d.providers || []);
          setCategories(d.categories || []);
          setVerifications(d.verifications || []);
          setReviews(d.reviews || []);
          setInquiriesCount(d.inquiriesCount || 0);
        }
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const loading = authLoading || !gateChecked || (user?.role === 'admin' && !loaded);

  const handleAdminPasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    setPasscodeSubmitting(true);

    const action = !envConfigured && !isClaimed ? 'claim' : 'login';
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'SkillNestClient',
        },
        body: JSON.stringify({ action, passcode: passcodeInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasscodeError(data.error || 'Authentication failed');
      } else {
        setPasscodeInput('');
        setIsClaimed(true);
        await refreshSession();
      }
    } catch {
      setPasscodeError('Network error while verifying admin passcode.');
    } finally {
      setPasscodeSubmitting(false);
    }
  };

  const runAdminAction = async (payload: Record<string, unknown>) => {
    setAdminMessage('');
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'SkillNestClient',
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await loadAdminData();
      setAdminMessage('Platform update applied.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catDesc.trim()) return;
    await runAdminAction({
      action: 'create_category',
      name: catName,
      description: catDesc,
      iconName: 'Briefcase',
    });
    setCatName('');
    setCatDesc('');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    const needsSetup = !envConfigured && !isClaimed;
    return (
      <div className="bg-[#F8FAFC] min-h-[82vh] py-16 px-4 sm:px-6">
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#0F766E]">
              SkillNext Administration
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              {needsSetup ? 'Set Admin Passcode' : 'Admin Console Sign In'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {needsSetup
                ? 'First-run setup: enter your chosen administrator password to lock and activate the SkillNext Admin Console.'
                : 'Enter your administrator passcode to manage verification approvals, users, and categories.'}
            </p>
          </div>

          <form onSubmit={handleAdminPasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {needsSetup ? 'Create Admin Password' : 'Admin Password'}
              </label>
              <input
                type="password"
                required
                minLength={needsSetup ? 6 : 1}
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder={
                  needsSetup ? 'Choose password (min 6 chars)' : 'Enter admin password'
                }
                className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {passcodeError && (
              <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                {passcodeError}
              </p>
            )}

            <button
              type="submit"
              disabled={passcodeSubmitting}
              className="w-full py-3 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {passcodeSubmitting
                ? 'Verifying...'
                : needsSetup
                  ? 'Save Password & Open Admin Console'
                  : 'Unlock Admin Console'}
            </button>
          </form>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            For production deployments, set <code className="font-mono">ADMIN_PASSCODE</code> in
            Vercel / Settings → Secrets to override the first-run setup password.
          </p>
        </div>
      </div>
    );
  }

  const pendingVerifications = verifications.filter((v) => v.status === 'pending');

  return (
    <DashboardShell
      title="Admin Operations Console"
      subtitle="Manage provider verification approvals, marketplace users, Nigerian categories, and review moderation."
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        {
          id: 'verifications',
          label: 'Verification Queue',
          icon: ShieldAlert,
          badge: pendingVerifications.length,
        },
        {
          id: 'users',
          label: 'User Management',
          icon: Users,
          badge: users.length,
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: FolderKanban,
          badge: categories.length,
        },
        {
          id: 'moderation',
          label: 'Review Moderation',
          icon: MessageSquareWarning,
          badge: reviews.length,
        },
      ]}
    >
      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Registered Users</p>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
            {users.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Verified Providers</p>
          <p className="text-2xl font-bold text-[#0F766E] tabular-nums mt-1">
            {providers.filter((p) => p.verificationStatus === 'verified').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Pending Vetting</p>
          <p className="text-2xl font-bold text-[#D4A017] tabular-nums mt-1">
            {pendingVerifications.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Active Inquiries</p>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
            {inquiriesCount}
          </p>
        </div>
      </div>

      {adminMessage && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-xs font-medium text-[#0F766E] rounded-lg">
          {adminMessage}
        </div>
      )}

      {/* TAB 1: VERIFICATION QUEUE */}
      {activeTab === 'verifications' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#0F172A]">
            Provider Verification Submissions
          </h2>
          <div className="divide-y divide-slate-100">
            {verifications.map((ver) => (
              <div
                key={ver.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-[#0F172A]">
                      {ver.businessName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{ver.categoryName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ver.location}</span>
                  </div>
                  <p className="text-sm text-slate-700 font-mono tabular-nums">
                    {ver.idType} ending ••••{ver.idLastFour}
                    {ver.cacNumber ? ` · CAC ${ver.cacNumber}` : ''}
                  </p>
                  <p className="text-xs capitalize text-slate-500">
                    Status: <strong className="text-[#0F172A]">{ver.status}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ver.status !== 'verified' && (
                    <button
                      type="button"
                      onClick={() =>
                        runAdminAction({
                          action: 'review_verification',
                          verificationId: ver.id,
                          decision: 'verified',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-xs font-semibold rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Approve
                    </button>
                  )}
                  {ver.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() =>
                        runAdminAction({
                          action: 'review_verification',
                          verificationId: ver.id,
                          decision: 'rejected',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg"
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-[#0F172A]">Platform Accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#0F172A]">{u.fullName}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-700">{u.role}</td>
                    <td className="py-3 px-4 text-slate-600">{u.location}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          u.isActive ? 'text-[#0F766E]' : 'text-red-600'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction({
                              action: 'toggle_user_status',
                              userId: u.id,
                              isActive: !u.isActive,
                            })
                          }
                          className="text-xs font-semibold text-slate-600 hover:text-[#0F172A] underline"
                        >
                          {u.isActive ? 'Suspend' : 'Restore'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: CATEGORY MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateCategory}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-[#0F172A]">Add Sector Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Category name"
                className="h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="text"
                required
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Concise sector description"
                className="sm:col-span-2 h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg"
            >
              Add Category
            </button>
          </form>

          <section className="bg-white border border-slate-200 rounded-xl p-6 divide-y divide-slate-100">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {cat.name}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      /{cat.slug}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600">{cat.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    runAdminAction({
                      action: 'toggle_category',
                      categoryId: cat.id,
                      isActive: !cat.isActive,
                    })
                  }
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border shrink-0 ${
                    cat.isActive
                      ? 'bg-teal-50 text-[#0F766E] border-teal-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {cat.isActive ? 'Active' : 'Hidden'}
                </button>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* TAB 4: CONTENT & REVIEW MODERATION */}
      {activeTab === 'moderation' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#0F172A]">
            Client Review Moderation
          </h2>
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    For <strong className="text-[#0F172A]">{rev.providerBusiness}</strong>{' '}
                    · By {rev.clientName} · {rev.rating}.0 stars
                  </p>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {rev.projectTitle}
                  </p>
                  <p className="text-sm text-slate-600">{rev.comment}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    runAdminAction({
                      action: 'moderate_review',
                      providerId: rev.providerId,
                      reviewId: rev.id,
                      isHidden: !rev.isHidden,
                    })
                  }
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-[#0F172A] hover:bg-slate-50 shrink-0"
                >
                  {rev.isHidden ? 'Restore Review' : 'Hide Review'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
