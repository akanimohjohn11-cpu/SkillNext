'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  ImagePlus,
  MessageSquare,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { DashboardShell } from '@/components/DashboardShell';
import { SmartImage } from '@/components/SmartImage';
import { formatNaira, LAGOS_LOCATIONS, SEED_CATEGORIES } from '@/lib/constants';
import { Inquiry, ProviderProfile, ServiceRequest } from '@/types';

interface CompletenessState {
  score: number;
  checks: { label: string; completed: boolean }[];
}

export default function ProviderDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('inquiries');

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessState>({
    score: 0,
    checks: [],
  });
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [openRequests, setOpenRequests] = useState<ServiceRequest[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<Inquiry['status']>('replied');

  // Profile editor fields
  const [businessName, setBusinessName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('Victoria Island, Lagos');
  const [categorySlug, setCategorySlug] = useState('home-services');
  const [skillsText, setSkillsText] = useState('');
  const [startingPrice, setStartingPrice] = useState('150000');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');

  // Service form
  const [srvTitle, setSrvTitle] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState('120000');
  const [srvDelivery, setSrvDelivery] = useState('3–5 days');

  // Portfolio form
  const [portTitle, setPortTitle] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [portLocation, setPortLocation] = useState('Lekki Phase 1, Lagos');
  const [portYear, setPortYear] = useState('2026');
  const [portImageUrl, setPortImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Verification form
  const [idType, setIdType] = useState<'NIN' | 'BVN' | 'Drivers License' | 'International Passport'>('NIN');
  const [idLastFour, setIdLastFour] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [verSubmitting, setVerSubmitting] = useState(false);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    (async () => {
      try {
        const [provRes, inqRes, reqRes] = await Promise.all([
          fetch(`/api/providers/${encodeURIComponent(user.id)}`, { cache: 'no-store' }),
          fetch('/api/inquiries', { cache: 'no-store' }),
          fetch('/api/requests', { cache: 'no-store' }),
        ]);

        if (!active) return;
        if (provRes.ok) {
          const d = await provRes.json();
          const p: ProviderProfile = d.provider;
          setProvider(p);
          setCompleteness(d.completeness);
          setBusinessName(p.businessName);
          setHeadline(p.headline);
          setBio(p.bio);
          setLocation(p.location);
          setCategorySlug(p.categorySlug);
          setSkillsText(p.skills.join(', '));
          setStartingPrice(String(p.startingPriceNgn));
        }
        if (inqRes.ok) {
          const d = await inqRes.json();
          const list: Inquiry[] = d.inquiries || [];
          setInquiries(list);
          if (list.length > 0) {
            setSelectedInquiryId((prev) => prev || list[0].id);
          }
        }
        if (reqRes.ok) {
          const d = await reqRes.json();
          setOpenRequests(d.requests || []);
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

  const patchProvider = async (payload: Record<string, unknown>) => {
    if (!provider) return null;
    const res = await fetch(`/api/providers/${provider.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'SkillNestClient',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setProvider(data.provider);
    setCompleteness(data.completeness);
    return data.provider as ProviderProfile;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice('');
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = await patchProvider({
        businessName,
        headline,
        bio,
        location,
        categorySlug,
        skills,
        startingPriceNgn: Number(startingPrice),
      });
      setProfileNotice(
        updated ? 'Profile changes published live.' : 'Unable to save profile.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    bucket: 'avatars' | 'portfolios',
    onDone: (url: string) => void
  ) => {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', bucket);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-Requested-With': 'SkillNestClient' },
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        onDone(data.url);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) return;
    await patchProvider({
      addService: {
        title: srvTitle,
        description: srvDesc,
        priceNgn: Number(srvPrice),
        priceUnit: 'starting_at',
        deliveryEstimate: srvDelivery,
      },
    });
    setSrvTitle('');
    setSrvDesc('');
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portTitle.trim() || !portImageUrl) return;
    await patchProvider({
      addPortfolio: {
        title: portTitle,
        description: portDesc,
        imageUrl: portImageUrl,
        location: portLocation,
        completedYear: portYear,
      },
    });
    setPortTitle('');
    setPortDesc('');
    setPortImageUrl('');
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerSubmitting(true);
    try {
      await patchProvider({
        submitVerification: {
          idType,
          idLastFour,
          cacNumber: cacNumber.trim() || undefined,
        },
      });
      setIdLastFour('');
    } finally {
      setVerSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiryId || !replyText.trim()) return;
    const res = await fetch('/api/inquiries', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'SkillNestClient',
      },
      body: JSON.stringify({
        inquiryId: selectedInquiryId,
        body: replyText,
        status: replyStatus,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setInquiries((prev) =>
        prev.map((i) => (i.id === selectedInquiryId ? data.inquiry : i))
      );
      setReplyText('');
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
          Sign in to access your Provider Studio
        </h1>
        <Link
          href="/login?next=/dashboard/provider"
          className="inline-block px-6 py-3 bg-[#0F766E] text-white text-sm font-semibold rounded-lg"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          No Provider Profile Found
        </h1>
        <p className="text-sm text-slate-600">
          Your current account is registered as a client. Create a provider studio account
          to publish services and receive leads.
        </p>
        <Link
          href="/signup?role=provider"
          className="inline-block px-6 py-3 bg-[#0F766E] text-white text-sm font-semibold rounded-lg"
        >
          Register Provider Studio
        </Link>
      </div>
    );
  }

  const activeInquiry = inquiries.find((i) => i.id === selectedInquiryId);

  return (
    <DashboardShell
      title={provider.businessName}
      subtitle="Manage client inquiries, keep your portfolio fresh, and complete identity verification."
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        {
          id: 'inquiries',
          label: 'Client Inquiries',
          icon: MessageSquare,
          badge: inquiries.length,
        },
        {
          id: 'profile',
          label: 'Profile & Rate Card',
          icon: Briefcase,
        },
        {
          id: 'portfolio',
          label: 'Portfolio Showcase',
          icon: ImagePlus,
          badge: provider.portfolio.length,
        },
        {
          id: 'verification',
          label: 'Verification Status',
          icon: ShieldCheck,
        },
      ]}
    >
      {/* Profile Completeness & Public Link Strip */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Profile Completeness</p>
            <p className="text-xl font-bold text-[#0F172A] tabular-nums mt-0.5">
              {completeness.score}% Complete
            </p>
          </div>
          <Link
            href={`/providers/${provider.id}`}
            className="px-4 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50 hover:bg-teal-100 rounded-lg whitespace-nowrap self-start sm:self-center"
          >
            View Live Public Profile →
          </Link>
        </div>

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0F766E] transition-all duration-300"
            style={{ width: `${completeness.score}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
          {completeness.checks.map((chk) => (
            <div
              key={chk.label}
              className="flex items-center gap-2 text-xs text-slate-600"
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  chk.completed ? 'text-[#0F766E]' : 'text-slate-300'
                }`}
                aria-hidden="true"
              />
              <span className={chk.completed ? 'text-[#0F172A]' : ''}>{chk.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TAB 1: INQUIRIES & OPEN REQUESTS */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {inquiries.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm font-semibold text-[#0F172A]">
                  No direct inquiries yet
                </p>
                <p className="text-xs text-slate-500">
                  Complete your portfolio and verification to rank higher in Lagos searches.
                </p>
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
                        {inq.clientName} · {inq.location}
                      </p>
                      <p className="text-sm font-semibold text-[#0F172A] truncate mt-0.5">
                        {inq.subject}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 capitalize tabular-nums">
                        {inq.status}
                        {inq.budgetNgn ? ` · ${formatNaira(inq.budgetNgn)}` : ''}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="md:col-span-7 flex flex-col justify-between">
                  {activeInquiry && (
                    <>
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#0F172A]">
                            {activeInquiry.subject}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Client: {activeInquiry.clientName}
                          </p>
                        </div>
                        <select
                          value={replyStatus}
                          onChange={(e) =>
                            setReplyStatus(e.target.value as Inquiry['status'])
                          }
                          aria-label="Update inquiry status"
                          className="h-8 px-2 bg-[#F8FAFC] border border-slate-200 rounded-md text-xs"
                        >
                          <option value="replied">Mark Replied</option>
                          <option value="quoted">Mark Quoted</option>
                          <option value="accepted">Mark Accepted</option>
                          <option value="completed">Mark Completed</option>
                        </select>
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
                                <p>{msg.body}</p>
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
                          placeholder="Reply with availability or quote breakdown..."
                          className="flex-1 h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                        />
                        <button
                          type="submit"
                          className="px-4 h-10 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" aria-hidden="true" />
                          Reply
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Open Client Service Briefs Board */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">
              Open Client Service Briefs
            </h2>
            <div className="divide-y divide-slate-100">
              {openRequests
                .filter((r) => r.status === 'open')
                .map((reqItem) => (
                  <div
                    key={reqItem.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-[#0F766E] font-medium">
                        {reqItem.categoryName} · {reqItem.location}
                      </p>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {reqItem.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                        {reqItem.description}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#0F172A] tabular-nums shrink-0">
                      Budget: {formatNaira(reqItem.budgetNgn)}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: PROFILE & RATE CARD */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  <SmartImage
                    src={provider.avatarUrl}
                    alt={provider.fullName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-[#0F172A] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    {uploadingImage ? 'Uploading...' : 'Upload Portrait'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'avatars', async (url) => {
                            await patchProvider({ avatarUrl: url });
                          });
                        }
                      }}
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    JPEG, PNG or WebP up to 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Business / Studio Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                >
                  {SEED_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Primary Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
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
                  Starting Fee (₦)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm tabular-nums"
                />
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
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Skills (comma separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Practice Bio
              </label>
              <textarea
                rows={4}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {profileNotice && (
              <p className="text-xs font-medium text-[#0F766E]">{profileNotice}</p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-xs font-semibold rounded-lg"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>

          {/* Service Rate Card */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#0F172A]">Service Rate Card</h2>
            <div className="divide-y divide-slate-100">
              {provider.services.map((srv) => (
                <div
                  key={srv.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{srv.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatNaira(srv.priceNgn)} · {srv.deliveryEstimate}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => patchProvider({ removeServiceId: srv.id })}
                    aria-label={`Delete ${srv.title}`}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddService}
              className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <input
                type="text"
                required
                value={srvTitle}
                onChange={(e) => setSrvTitle(e.target.value)}
                placeholder="New service title"
                className="h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="number"
                required
                min={1000}
                value={srvPrice}
                onChange={(e) => setSrvPrice(e.target.value)}
                placeholder="Price in ₦"
                className="h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm tabular-nums"
              />
              <input
                type="text"
                required
                value={srvDesc}
                onChange={(e) => setSrvDesc(e.target.value)}
                placeholder="Brief deliverable scope"
                className="h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={srvDelivery}
                  onChange={(e) => setSrvDelivery(e.target.value)}
                  placeholder="Turnaround (e.g., 5 days)"
                  className="flex-1 h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  className="px-4 h-10 bg-[#0F172A] text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                >
                  Add Service
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* TAB 3: PORTFOLIO MANAGER */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddPortfolio}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-[#0F172A]">
              Add Portfolio Case Study
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  placeholder="e.g., Ikoyi Duplex Joinery & Lighting"
                  className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={portLocation}
                    onChange={(e) => setPortLocation(e.target.value)}
                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    required
                    value={portYear}
                    onChange={(e) => setPortYear(e.target.value)}
                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Project Summary
              </label>
              <textarea
                rows={2}
                required
                value={portDesc}
                onChange={(e) => setPortDesc(e.target.value)}
                placeholder="Describe materials, engineering scope, and outcome..."
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-[#0F172A] cursor-pointer">
                <Upload className="w-4 h-4" aria-hidden="true" />
                {uploadingImage ? 'Uploading Image...' : 'Upload Project Photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, 'portfolios', setPortImageUrl);
                    }
                  }}
                />
              </label>
              {portImageUrl && (
                <span className="text-xs font-medium text-[#0F766E]">
                  Image ready for publish
                </span>
              )}
              <button
                type="submit"
                disabled={!portImageUrl || uploadingImage}
                className="ml-auto px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-xs font-semibold rounded-lg disabled:opacity-40"
              >
                Publish Portfolio Item
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {provider.portfolio.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  <SmartImage
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                  />
                </div>
                <div className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.location} · {item.completedYear}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => patchProvider({ removePortfolioId: item.id })}
                    aria-label={`Remove ${item.title}`}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VERIFICATION STATUS */}
      {activeTab === 'verification' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Identity & CAC Verification
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Current status:{' '}
                <span className="font-semibold capitalize text-[#0F766E]">
                  {provider.verificationStatus}
                </span>
              </p>
              {provider.verificationNotes && (
                <p className="text-xs text-slate-500 mt-1">
                  Reviewer notes: {provider.verificationNotes}
                </p>
              )}
            </div>
            <ShieldCheck
              className={`w-10 h-10 ${
                provider.verificationStatus === 'verified'
                  ? 'text-[#D4A017]'
                  : 'text-slate-300'
              }`}
              aria-hidden="true"
            />
          </div>

          {provider.verificationStatus === 'verified' ? (
            <p className="text-sm text-slate-700 leading-relaxed">
              Your SkillNest Verified badge is active across search results and your public
              profile. Keep your portfolio and Naira service rates updated to convert client
              inquiries.
            </p>
          ) : (
            <form onSubmit={handleSubmitVerification} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Government ID Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as typeof idType)}
                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="NIN">NIN Slip / Card</option>
                    <option value="International Passport">International Passport</option>
                    <option value="Drivers License">Driver&apos;s License</option>
                    <option value="BVN">BVN Verification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Last 4 Digits of ID
                  </label>
                  <input
                    type="text"
                    required
                    pattern="\d{4}"
                    maxLength={4}
                    value={idLastFour}
                    onChange={(e) => setIdLastFour(e.target.value)}
                    placeholder="4821"
                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CAC RC / BN Number (Optional)
                </label>
                <input
                  type="text"
                  value={cacNumber}
                  onChange={(e) => setCacNumber(e.target.value)}
                  placeholder="RC-1489201"
                  className="w-full h-10 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={verSubmitting}
                className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-xs font-semibold rounded-lg"
              >
                {verSubmitting ? 'Submitting...' : 'Submit for Admin Verification'}
              </button>
            </form>
          )}
        </section>
      )}
    </DashboardShell>
  );
}
