import { GENERATED_IMAGES, SEED_CATEGORIES } from '@/lib/constants';
import { getStore } from '@/lib/marketplace-store';
import { isUuid } from '@/lib/supabase/config';
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import {
  Category,
  Inquiry,
  Message,
  PortfolioItem,
  ProviderProfile,
  ProviderService,
  Review,
  ServiceRequest,
} from '@/types';

type SupabaseRow = Record<string, unknown>;

function unwrapRel(value: unknown): SupabaseRow | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (value[0] as SupabaseRow) || null;
  }
  return value as SupabaseRow;
}

function mapCategoryRow(row: SupabaseRow, countMap?: Map<string, number>): Category {
  const id = String(row.id || '');
  const slug = String(row.slug || '');
  const seedMatch = SEED_CATEGORIES.find((c) => c.slug === slug);
  return {
    id,
    name: String(row.name || seedMatch?.name || 'Other'),
    slug,
    description: String(row.description || seedMatch?.description || ''),
    iconName: String(row.icon_name || seedMatch?.iconName || 'Briefcase'),
    providerCount: countMap?.get(id) ?? seedMatch?.providerCount ?? 0,
    isFeatured: Boolean(row.is_featured),
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
  };
}

function mapProviderRow(row: SupabaseRow): ProviderProfile {
  const profile = unwrapRel(row.profiles);
  const category = unwrapRel(row.categories);
  const servicesRaw = Array.isArray(row.services) ? (row.services as SupabaseRow[]) : [];
  const portfolioRaw = Array.isArray(row.portfolio_items)
    ? (row.portfolio_items as SupabaseRow[])
    : [];
  const reviewsRaw = Array.isArray(row.reviews) ? (row.reviews as SupabaseRow[]) : [];

  const providerId = String(row.id || '');

  const services: ProviderService[] = servicesRaw.map((s) => ({
    id: String(s.id || ''),
    providerId: String(s.provider_id || providerId),
    title: String(s.title || ''),
    description: String(s.description || ''),
    priceNgn: Number(s.price_ngn || 0),
    priceUnit: (s.price_unit as ProviderService['priceUnit']) || 'fixed',
    deliveryEstimate: String(s.delivery_estimate || '3-5 days'),
  }));

  const portfolio: PortfolioItem[] = portfolioRaw.map((item) => ({
    id: String(item.id || ''),
    providerId: String(item.provider_id || providerId),
    title: String(item.title || ''),
    description: String(item.description || ''),
    imageUrl: String(item.image_url || GENERATED_IMAGES.residencePortfolio),
    location: String(item.location || 'Lagos'),
    completedYear: String(item.completed_year || '2026'),
  }));

  const reviews: Review[] = reviewsRaw.map((rev) => {
    const reviewer = unwrapRel(rev.profiles);
    return {
      id: String(rev.id || ''),
      providerId: String(rev.provider_id || providerId),
      clientId: String(rev.client_id || ''),
      clientName: String(reviewer?.full_name || 'Verified Client'),
      clientLocation: String(reviewer?.location || 'Lagos'),
      rating: Number(rev.rating || 5),
      comment: String(rev.comment || ''),
      projectTitle: String(rev.project_title || 'Project Delivery'),
      createdAt: String(rev.created_at || new Date().toISOString()),
      isHidden: Boolean(rev.is_hidden),
    };
  });

  return {
    id: providerId,
    userId: String(row.user_id || ''),
    fullName: String(profile?.full_name || row.business_name || 'SkillNest Pro'),
    headline: String(row.headline || ''),
    businessName: String(row.business_name || ''),
    bio: String(row.bio || ''),
    categorySlug: String(category?.slug || 'other'),
    categoryName: String(category?.name || 'Other'),
    skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
    location: String(row.location || 'Lagos'),
    serviceAreas: Array.isArray(row.service_areas) ? row.service_areas.map(String) : [],
    avatarUrl: String(
      row.avatar_url || profile?.avatar_url || GENERATED_IMAGES.techPortrait
    ),
    startingPriceNgn: Number(row.starting_price_ngn || 25000),
    yearsExperience: Number(row.years_experience || 1),
    responseTime: String(row.response_time || 'Within 2 hours'),
    completedJobs: Number(row.completed_jobs || 0),
    ratingAvg: Number(row.rating_avg || 5.0),
    reviewCount: Number(row.review_count || reviews.filter((r) => !r.isHidden).length),
    verificationStatus:
      (row.verification_status as ProviderProfile['verificationStatus']) || 'unverified',
    verificationNotes: row.verification_notes
      ? String(row.verification_notes)
      : undefined,
    cacRegistered: Boolean(row.cac_registered),
    ninVerified: Boolean(row.nin_verified),
    isFeatured: Boolean(row.is_featured),
    services,
    portfolio,
    reviews,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export async function fetchCategories(includeInactive = false): Promise<Category[]> {
  const store = getStore();
  if (!isSupabaseServerConfigured()) {
    return includeInactive
      ? store.categories
      : store.categories.filter((c) => c.isActive);
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return includeInactive
        ? store.categories
        : store.categories.filter((c) => c.isActive);
    }

    let query = supabase
      .from('categories')
      .select('id, name, slug, description, icon_name, is_featured, is_active, sort_order')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const [{ data: catData, error: catError }, { data: provCounts }] = await Promise.all([
      query,
      supabase.from('provider_profiles').select('category_id'),
    ]);

    if (catError || !catData || catData.length === 0) {
      return includeInactive
        ? store.categories
        : store.categories.filter((c) => c.isActive);
    }

    const countMap = new Map<string, number>();
    if (Array.isArray(provCounts)) {
      for (const row of provCounts) {
        const cid = row.category_id as string | null;
        if (cid) {
          countMap.set(cid, (countMap.get(cid) || 0) + 1);
        }
      }
    }

    return catData.map((row) => mapCategoryRow(row as SupabaseRow, countMap));
  } catch {
    return includeInactive
      ? store.categories
      : store.categories.filter((c) => c.isActive);
  }
}

export interface ProviderQueryFilters {
  q?: string;
  category?: string;
  location?: string;
  minRating?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  sort?: string;
}

export function filterAndSortProviders(
  providers: ProviderProfile[],
  filters: ProviderQueryFilters = {}
): ProviderProfile[] {
  const q = (filters.q || '').trim().toLowerCase();
  const category = (filters.category || '').trim().toLowerCase();
  const location = (filters.location || '').trim().toLowerCase();
  const minRating = filters.minRating || 0;
  const maxPrice = filters.maxPrice || 0;
  const verifiedOnly = Boolean(filters.verifiedOnly);
  const sort = filters.sort || 'featured';

  let list = providers.filter((p) => {
    if (category && category !== 'all' && p.categorySlug !== category) return false;
    if (
      location &&
      location !== 'all lagos & nigeria' &&
      !p.location.toLowerCase().includes(location) &&
      !p.serviceAreas.some((a) => a.toLowerCase().includes(location))
    ) {
      return false;
    }
    if (minRating > 0 && p.ratingAvg < minRating) return false;
    if (maxPrice > 0 && p.startingPriceNgn > maxPrice) return false;
    if (verifiedOnly && p.verificationStatus !== 'verified') return false;
    if (q) {
      const haystack = [
        p.fullName,
        p.businessName,
        p.headline,
        p.bio,
        p.categoryName,
        p.location,
        ...p.skills,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  if (sort === 'rating') {
    list = [...list].sort((a, b) => b.ratingAvg - a.ratingAvg);
  } else if (sort === 'price_asc') {
    list = [...list].sort((a, b) => a.startingPriceNgn - b.startingPriceNgn);
  } else if (sort === 'price_desc') {
    list = [...list].sort((a, b) => b.startingPriceNgn - a.startingPriceNgn);
  } else {
    list = [...list].sort(
      (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.ratingAvg - a.ratingAvg
    );
  }

  return list;
}

const PROVIDER_SELECT = `
  id, user_id, business_name, headline, bio, skills, location, service_areas,
  avatar_url, starting_price_ngn, years_experience, response_time, completed_jobs,
  rating_avg, review_count, verification_status, verification_notes,
  cac_registered, nin_verified, is_featured, created_at,
  profiles:user_id ( full_name, avatar_url ),
  categories:category_id ( name, slug ),
  services ( id, provider_id, title, description, price_ngn, price_unit, delivery_estimate ),
  portfolio_items ( id, provider_id, title, description, image_url, location, completed_year ),
  reviews ( id, provider_id, client_id, rating, project_title, comment, is_hidden, created_at, profiles:client_id ( full_name, location ) )
`;

export async function fetchProviders(
  filters: ProviderQueryFilters = {}
): Promise<ProviderProfile[]> {
  const store = getStore();
  if (!isSupabaseServerConfigured()) {
    return filterAndSortProviders(store.providers, filters);
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return filterAndSortProviders(store.providers, filters);
    }

    const { data, error } = await supabase
      .from('provider_profiles')
      .select(PROVIDER_SELECT)
      .order('is_featured', { ascending: false })
      .order('rating_avg', { ascending: false });

    if (error || !data || data.length === 0) {
      return filterAndSortProviders(store.providers, filters);
    }

    const mapped = data.map((row) => mapProviderRow(row as SupabaseRow));
    return filterAndSortProviders(mapped, filters);
  } catch {
    return filterAndSortProviders(store.providers, filters);
  }
}

export async function fetchProviderById(id: string): Promise<ProviderProfile | null> {
  const store = getStore();
  const demoMatch =
    store.providers.find((p) => p.id === id) ||
    store.providers.find((p) => p.userId === id) ||
    null;

  if (!isSupabaseServerConfigured() || !isUuid(id)) {
    return demoMatch;
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return demoMatch;

    const { data: byId } = await supabase
      .from('provider_profiles')
      .select(PROVIDER_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (byId) {
      return mapProviderRow(byId as SupabaseRow);
    }

    const { data: byUserId } = await supabase
      .from('provider_profiles')
      .select(PROVIDER_SELECT)
      .eq('user_id', id)
      .maybeSingle();

    if (byUserId) {
      return mapProviderRow(byUserId as SupabaseRow);
    }

    return demoMatch;
  } catch {
    return demoMatch;
  }
}

export async function fetchSavedProviderIds(userId?: string): Promise<string[]> {
  if (!userId) return [];
  const store = getStore();
  if (!isSupabaseServerConfigured() || !isUuid(userId)) {
    return store.savedProviders[userId] || [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return store.savedProviders[userId] || [];

    const { data, error } = await supabase
      .from('saved_providers')
      .select('provider_id')
      .eq('client_id', userId);

    if (error || !data) {
      return store.savedProviders[userId] || [];
    }
    return data.map((r) => String(r.provider_id));
  } catch {
    return store.savedProviders[userId] || [];
  }
}

export async function ensureSupabaseProviderProfile(params: {
  userId: string;
  fullName: string;
  location: string;
  businessName?: string;
  categorySlug?: string;
  headline?: string;
}): Promise<ProviderProfile | null> {
  if (!isSupabaseServerConfigured() || !isUuid(params.userId)) return null;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from('provider_profiles')
    .select(PROVIDER_SELECT)
    .eq('user_id', params.userId)
    .maybeSingle();

  if (existing) {
    return mapProviderRow(existing as SupabaseRow);
  }

  const slug = params.categorySlug || 'home-services';
  const { data: cat } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  const categoryName = cat?.name ? String(cat.name) : 'Home Services';
  const { data: created, error } = await supabase
    .from('provider_profiles')
    .insert({
      user_id: params.userId,
      business_name: params.businessName?.trim() || `${params.fullName} Studio`,
      headline:
        params.headline?.trim() ||
        `Verified ${categoryName} Specialist in ${params.location}`,
      bio: `Independent ${categoryName.toLowerCase()} professional serving clients across ${params.location}. Reach out with your project brief for a clear scope and Naira estimate.`,
      category_id: cat?.id ?? null,
      skills: [categoryName, 'Consultation', 'Project Delivery'],
      location: params.location || 'Victoria Island, Lagos',
      service_areas: [params.location || 'Victoria Island, Lagos'],
      avatar_url: GENERATED_IMAGES.techPortrait,
      starting_price_ngn: 50000,
      years_experience: 3,
      response_time: 'Within 3 hours',
      rating_avg: 5.0,
    })
    .select('id')
    .single();

  if (error || !created) return null;

  await supabase.from('services').insert({
    provider_id: created.id,
    title: `${categoryName} Discovery Consultation`,
    description: 'Initial site or project assessment and written Naira quotation.',
    price_ngn: 50000,
    price_unit: 'fixed',
    delivery_estimate: '48 hours',
  });

  return fetchProviderById(String(created.id));
}

export function mapServiceRequestRow(row: SupabaseRow): ServiceRequest {
  const client = unwrapRel(row.profiles);
  const category = unwrapRel(row.categories);
  return {
    id: String(row.id || ''),
    clientId: String(row.client_id || ''),
    clientName: String(client?.full_name || 'SkillNest Client'),
    title: String(row.title || ''),
    categorySlug: String(category?.slug || 'other'),
    categoryName: String(category?.name || 'Other'),
    description: String(row.description || ''),
    location: String(row.location || 'Lagos'),
    budgetNgn: Number(row.budget_ngn || 0),
    urgency: (row.urgency as ServiceRequest['urgency']) || 'this_week',
    status: (row.status as ServiceRequest['status']) || 'open',
    responsesCount: 0,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export function mapInquiryRow(row: SupabaseRow): Inquiry {
  const provider = unwrapRel(row.provider_profiles);
  const providerOwner = unwrapRel(provider?.profiles);
  const client = unwrapRel(row.profiles);
  const messagesRaw = Array.isArray(row.messages) ? (row.messages as SupabaseRow[]) : [];

  const providerUserId = String(provider?.user_id || '');

  const messages: Message[] = messagesRaw
    .map((m) => {
      const sender = unwrapRel(m.profiles);
      const senderId = String(m.sender_id || '');
      const inferredRole =
        (sender?.role as Message['senderRole']) ||
        (senderId === providerUserId ? 'provider' : 'client');
      return {
        id: String(m.id || ''),
        inquiryId: String(m.inquiry_id || row.id || ''),
        senderId,
        senderName: String(sender?.full_name || 'Member'),
        senderRole: inferredRole,
        body: String(m.body || ''),
        createdAt: String(m.created_at || new Date().toISOString()),
      };
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    id: String(row.id || ''),
    providerId: String(row.provider_id || ''),
    providerName: String(providerOwner?.full_name || provider?.business_name || 'Provider'),
    providerBusiness: String(provider?.business_name || 'Provider Studio'),
    clientId: String(row.client_id || ''),
    clientName: String(client?.full_name || 'Client'),
    subject: String(row.subject || ''),
    budgetNgn: row.budget_ngn !== null && row.budget_ngn !== undefined ? Number(row.budget_ngn) : undefined,
    preferredDate: row.preferred_date ? String(row.preferred_date) : undefined,
    location: String(row.location || 'Lagos'),
    status: (row.status as Inquiry['status']) || 'new',
    messages,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.created_at || new Date().toISOString()),
  };
}
