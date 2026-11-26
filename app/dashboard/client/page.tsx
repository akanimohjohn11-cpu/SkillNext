'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bookmark,
  ClipboardList,
  MessageSquare,
  Plus,
  Send,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { DashboardShell } from '@/components/DashboardShell';
import { ProviderCard } from '@/components/ProviderCard';
import { formatNaira, LAGOS_LOCATIONS, SEED_CATEGORIES } from '@/lib/constants';
import { Inquiry, ProviderProfile, ServiceRequest } from '@/types';

export default function ClientDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [savedProviders, setSavedProviders] = useState<ProviderProfile[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Create request form
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] = useState(SEED_CATEGORIES[1].slug);
  const [reqLocation, setReqLocation] = useState('Victoria Island, Lagos');
  const [reqBudget, setReqBudget] = useState('250000');
  const [reqUrgency, setReqUrgency] = useState<'immediate' | 'this_week' | 'this_month' | 'flexible'>('this_week');
  const [reqDesc, setReqDesc] = useState('');
  const [reqError, setReqError] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    (async () => {
      try {
        const [reqRes, provRes, inqRes] = await Promise.all([
          fetch('/api/requests', { cache: 'no-store' }),
          fetch('/api/providers', { cache: 'no-store' }),
          fetch('/api/inquiries', { cache: 'no-store' }),
        ]);

        if (!active) return;
        if (reqRes.ok) {
          const d = await reqRes.json();
          setRequests(d.requests || []);
        }
        if (provRes.ok) {
          const d = await provRes.json();
          const savedSet = new Set<string>(d.savedProviderIds || []);
          setSavedProviders(
            (d.providers || []).filter((p: ProviderProfile) => savedSet.has(p.id))
          );
        }
        if (inqRes.ok) {
          const d = await inqRes.json();
          const list: Inquiry[] = d.inquiries || [];
          setInquiries(list);
          if (list.length > 0) {
            setSelectedInquiryId((prev) => prev || list[0].id);
          }
        }
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const loading = Boolean(user) && !loaded;

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError('');
    setReqSubmitting(true);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'SkillNestClient',
        },
        body: JSON.stringify({
          title: reqTitle,
          categorySlug: reqCategory,
          location: reqLocation,
          budgetNgn: Number(reqBudget),
          urgency: reqUrgency,
          description: reqDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReqError(data.error || 'Could not publish request.');
      } else {
        setRequests((prev) => [data.request, ...prev]);
        setShowNewRequest(false);
        setReqTitle('');
        setReqDesc('');
      }
    } finally {
      setReqSubmitting(false);
    }
  };

  const handleRequestStatus = async (
    id: string,
    status: ServiceRequest['status']
  ) => {
    const res = await fetch('/api/requests', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'SkillNestClient',
      },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const data = await res.json();
      setRequests((prev) => prev.map((r) => (r.id === id ? data.request : r)));
    }
  };

  const handleToggleSave = async (providerId: string) => {
    const res = await fetch('/api/providers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'SkillNestClient',
      },
      body: JSON.stringify({ providerId }),
    });
    if (res.ok) {
      setSavedProviders((prev) => prev.filter((p) => p.id !== providerId));
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiryId || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'SkillNestClient',
        },
        body: JSON.stringify({ inquiryId: selectedInquiryId, body: replyText }),
      });
      if (res.ok) {
        const data = await res.json();
        setInquiries((prev) =>
          prev.map((i) => (i.id === selectedInquiryId ? data.inquiry : i))
        );
        setReplyText('');
      }
    } finally {
      setSendingReply(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Sign in to access your Client Workspace
        </h1>
        <p className="text-sm text-slate-600">
          Manage your project requests, saved Lagos professionals, and quote messages.
        </p>
        <Link
          href="/login?next=/dashboard/client"
          className="inline-block px-6 py-3 bg-[#0F766E] text-white text-sm font-semibold rounded-lg"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const activeInquiry = inquiries.find((i) => i.id === selectedInquiryId);

  return (
    <DashboardShell
      title="Client Workspace"
      subtitle="Track your service briefs, saved Lagos specialists, and active quote conversations."
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        {
          id: 'requests',
          label: 'My Service Requests',
          icon: ClipboardList,
          badge: requests.length,
        },
        {
          id: 'messages',
          label: 'Messages & Quotes',
          icon: MessageSquare,
          badge: inquiries.length,
        },
        {
          id: 'saved',
          label: 'Saved Providers',
          icon: Bookmark,
          badge: savedProviders.length,
        },
      ]}
    >
      {/* Top KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Active Requests</p>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
            {requests.filter((r) => r.status === 'open' || r.status === 'in_review').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Message Threads</p>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
            {inquiries.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Saved Pros</p>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
            {savedProviders.length}
          </p>
        </div>
      </div>

      {/* TAB 1: SERVICE REQUESTS */}
      {activeTab === 'requests' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Service Requests</h2>
              <p className="text-xs text-slate-500">
                Publish a project brief to receive quotes from verified providers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewRequest((s) => !s)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap self-start"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              {showNewRequest ? 'Close Form' : 'New Service Request'}
            </button>
          </div>

          {showNewRequest && (
            <form
              onSubmit={handleCreateRequest}
              className="p-5 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-4"
            >
              <h3 className="text-sm font-bold text-[#0F172A]">
                Create New Project Brief
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Request Title
                  </label>
                  <input
                    type="text"
                    required
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    placeholder="e.g., 5kVA Solar Inverter Setup in Lekki"
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                  >
                    {SEED_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <select
                    value={reqLocation}
                    onChange={(e) => setReqLocation(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                  >
                    {LAGOS_LOCATIONS.filter((l) => l !== 'All Lagos & Nigeria').map(
                      (loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Budget (₦)
                  </label>
                  <input
                    type="number"
                    required
                    min={5000}
                    value={reqBudget}
                    onChange={(e) => setReqBudget(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Timeline
                  </label>
                  <select
                    value={reqUrgency}
                    onChange={(e) =>
                      setReqUrgency(e.target.value as ServiceRequest['urgency'])
                    }
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="immediate">Urgent (48 hours)</option>
                    <option value="this_week">This week</option>
                    <option value="this_month">This month</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Detailed Scope
                </label>
                <textarea
                  required
                  rows={3}
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Describe dimensions, access hours, or specific deliverables..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>

              {reqError && <p className="text-xs text-red-600">{reqError}</p>}

              <button
                type="submit"
                disabled={reqSubmitting}
                className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-xs font-semibold rounded-lg"
              >
                {reqSubmitting ? 'Publishing...' : 'Publish Service Request'}
              </button>
            </form>
          )}

          {requests.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-slate-600">
                You haven&apos;t posted any service requests yet.
              </p>
              <button
                type="button"
                onClick={() => setShowNewRequest(true)}
                className="px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg"
              >
                Create Your First Request
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((reqItem) => (
                <div
                  key={reqItem.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-[#0F766E]">
                        {reqItem.categoryName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{reqItem.location}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize font-medium text-slate-700">
                        Status: {reqItem.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#0F172A]">
                      {reqItem.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {reqItem.description}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                    <span className="text-sm font-bold text-[#0F172A] tabular-nums">
                      {formatNaira(reqItem.budgetNgn)}
                    </span>
                    <div className="flex items-center gap-2">
                      {reqItem.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleRequestStatus(reqItem.id, 'completed')}
                          className="text-xs font-medium text-[#0F766E] hover:underline"
                        >
                          Mark Completed
                        </button>
                      )}
                      {reqItem.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleRequestStatus(reqItem.id, 'cancelled')}
                          className="text-xs font-medium text-slate-500 hover:text-red-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: MESSAGES */}
      {activeTab === 'messages' && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {inquiries.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm text-slate-600">
                No active inquiry threads yet. Browse professionals and send your first
                project inquiry.
              </p>
              <Link
                href="/browse"
                className="inline-block px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg"
              >
                Browse Professionals
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
              <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-200 divide-y divide-slate-100">
                {inquiries.map((inq) => (
                  <button
                    key={inq.id}
                    type="button"
                    onClick={() => setSelectedInquiryId(inq.id)}
                    className={`w-full p-4 text-left transition-colors ${
                      inq.id === selectedInquiryId
                        ? 'bg-teal-50/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-medium text-[#0F766E]">
                      {inq.providerBusiness}
                    </p>
                    <p className="text-sm font-semibold text-[#0F172A] truncate mt-0.5">
                      {inq.subject}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 capitalize">
                      {inq.status} · {inq.messages.length} messages
                    </p>
                  </button>
                ))}
              </div>

              <div className="md:col-span-7 flex flex-col justify-between">
                {activeInquiry ? (
                  <>
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A]">
                          {activeInquiry.subject}
                        </h3>
                        <p className="text-xs text-slate-500">
                          With {activeInquiry.providerName} · {activeInquiry.location}
                        </p>
                      </div>
                      <Link
                        href={`/providers/${activeInquiry.providerId}`}
                        className="text-xs font-semibold text-[#0F766E] hover:underline shrink-0"
                      >
                        View Pro
                      </Link>
                    </div>

                    <div className="p-4 space-y-3 flex-1 max-h-[300px] overflow-y-auto bg-[#F8FAFC]">
                      {activeInquiry.messages.map((msg) => {
                        const isMine = msg.senderId === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isMine ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                                isMine
                                  ? 'bg-[#0F766E] text-white'
                                  : 'bg-white border border-slate-200 text-[#0F172A]'
                              }`}
                            >
                              <p className="text-[11px] opacity-75 mb-0.5">
                                {msg.senderName}
                              </p>
                              <p className="leading-relaxed">{msg.body}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form
                      onSubmit={handleSendReply}
                      className="p-3 border-t border-slate-200 flex gap-2 bg-white"
                    >
                      <input
                        type="text"
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply}
                        className="px-4 h-10 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="p-8 text-sm text-slate-500">
                    Select a conversation on the left.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: SAVED PROVIDERS */}
      {activeTab === 'saved' && (
        <section className="space-y-4">
          {savedProviders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <p className="text-sm text-slate-600">
                You have no saved providers yet. Bookmark professionals while browsing to
                compare quotes later.
              </p>
              <Link
                href="/browse"
                className="inline-block px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg"
              >
                Explore Directory
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isSaved
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </DashboardShell>
  );
}
