import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { fetchCategories, fetchProviders } from '@/lib/marketplace-data';
import { generateId, getStore } from '@/lib/marketplace-store';
import { isUuid } from '@/lib/supabase/config';
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server';

async function getAdminSupabaseClient() {
  if (!isSupabaseServerConfigured()) return null;
  return createServiceRoleSupabaseClient() || (await createServerSupabaseClient());
}

export async function GET() {
  const session = await getCurrentSessionUser();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const store = getStore();
  if (isSupabaseServerConfigured()) {
    const supabase = await getAdminSupabaseClient();
    if (supabase) {
      try {
        const [
          providers,
          categories,
          { data: profileRows },
          { data: verRows },
          { data: reqRows },
          { count: inqCount },
          { data: contactRows },
        ] = await Promise.all([
          fetchProviders(),
          fetchCategories(true),
          supabase
            .from('profiles')
            .select('id, email, full_name, phone, role, avatar_url, location, is_active, created_at')
            .order('created_at', { ascending: false }),
          supabase
            .from('verification_submissions')
            .select(`
              id, provider_id, id_type, id_last_four, cac_number, document_url, status, reviewed_notes, submitted_at,
              provider_profiles:provider_id ( business_name, location, profiles:user_id ( full_name ), categories:category_id ( name ) )
            `)
            .order('submitted_at', { ascending: false }),
          supabase
            .from('service_requests')
            .select('id, title, status, location, budget_ngn, created_at')
            .order('created_at', { ascending: false }),
          supabase.from('inquiries').select('id', { count: 'exact', head: true }),
          supabase
            .from('contact_submissions')
            .select('id, name, email, phone, topic, message, created_at')
            .order('created_at', { ascending: false }),
        ]);

        if (Array.isArray(profileRows) && profileRows.length > 0) {
          const users = profileRows.map((u) => ({
            id: String(u.id),
            email: String(u.email),
            fullName: String(u.full_name),
            phone: String(u.phone || ''),
            role: u.role,
            avatarUrl: u.avatar_url ? String(u.avatar_url) : undefined,
            location: String(u.location || 'Lagos'),
            isActive: Boolean(u.is_active),
            createdAt: String(u.created_at),
          }));

          const verifications = Array.isArray(verRows)
            ? verRows.map((v) => {
                const rawProv = v.provider_profiles as unknown;
                const prov = (Array.isArray(rawProv) ? rawProv[0] : rawProv) as Record<string, unknown> | null;
                const rawOwner = prov?.profiles as unknown;
                const owner = (Array.isArray(rawOwner) ? rawOwner[0] : rawOwner) as Record<string, unknown> | null;
                const rawCat = prov?.categories as unknown;
                const cat = (Array.isArray(rawCat) ? rawCat[0] : rawCat) as Record<string, unknown> | null;
                return {
                  id: String(v.id),
                  providerId: String(v.provider_id),
                  providerName: String(owner?.full_name || prov?.business_name || 'Provider'),
                  businessName: String(prov?.business_name || 'Studio'),
                  categoryName: String(cat?.name || 'General'),
                  location: String(prov?.location || 'Lagos'),
                  idType: v.id_type,
                  idLastFour: String(v.id_last_four),
                  cacNumber: v.cac_number ? String(v.cac_number) : undefined,
                  portfolioSampleUrl: v.document_url ? String(v.document_url) : undefined,
                  status: v.status,
                  submittedAt: String(v.submitted_at),
                  reviewedNotes: v.reviewed_notes ? String(v.reviewed_notes) : undefined,
                };
              })
            : store.verifications;

          const allReviews = providers.flatMap((p) =>
            p.reviews.map((r) => ({
              ...r,
              providerName: p.fullName,
              providerBusiness: p.businessName,
            }))
          );

          return NextResponse.json({
            users,
            providers,
            categories,
            verifications,
            reviews: allReviews,
            requests: reqRows || store.requests,
            inquiriesCount: typeof inqCount === 'number' ? inqCount : store.inquiries.length,
            contacts: contactRows || store.contacts,
          });
        }
      } catch {
        // Fall through to preview store
      }
    }
  }

  const allReviews = store.providers.flatMap((p) =>
    p.reviews.map((r) => ({
      ...r,
      providerName: p.fullName,
      providerBusiness: p.businessName,
    }))
  );

  return NextResponse.json({
    users: store.users.map((u) => u.user),
    providers: store.providers,
    categories: store.categories,
    verifications: store.verifications,
    reviews: allReviews,
    requests: store.requests,
    inquiriesCount: store.inquiries.length,
    contacts: store.contacts,
  });
}

const adminActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('review_verification'),
    verificationId: z.string().min(1),
    decision: z.enum(['verified', 'rejected']),
    notes: z.string().max(400).optional(),
  }),
  z.object({
    action: z.literal('toggle_user_status'),
    userId: z.string().min(1),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal('create_category'),
    name: z.string().min(2).max(60),
    description: z.string().min(10).max(300),
    iconName: z.string().min(2).max(40).default('Briefcase'),
  }),
  z.object({
    action: z.literal('toggle_category'),
    categoryId: z.string().min(1),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal('moderate_review'),
    providerId: z.string().min(1),
    reviewId: z.string().min(1),
    isHidden: z.boolean(),
  }),
]);

export async function PATCH(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid admin action' },
      { status: 400 }
    );
  }

  const store = getStore();
  const data = parsed.data;

  // Try Supabase admin mutation when entity IDs are UUIDs
  if (isSupabaseServerConfigured()) {
    const supabase = await getAdminSupabaseClient();
    if (supabase) {
      if (data.action === 'review_verification' && isUuid(data.verificationId)) {
        const notes =
          data.notes?.trim() ||
          (data.decision === 'verified'
            ? 'Identity & credentials verified by SkillNest Trust Team.'
            : 'Submission requires clearer documentation.');

        const { data: updatedVer, error } = await supabase
          .from('verification_submissions')
          .update({
            status: data.decision,
            reviewed_notes: notes,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', data.verificationId)
          .select('id, provider_id')
          .maybeSingle();

        if (!error && updatedVer) {
          await supabase
            .from('provider_profiles')
            .update({
              verification_status: data.decision,
              verification_notes: notes,
              nin_verified: data.decision === 'verified',
            })
            .eq('id', updatedVer.provider_id);
          return NextResponse.json({ ok: true, verification: updatedVer });
        }
      }

      if (data.action === 'toggle_user_status' && isUuid(data.userId)) {
        const { data: updatedUser, error } = await supabase
          .from('profiles')
          .update({ is_active: data.isActive })
          .eq('id', data.userId)
          .select('id, is_active')
          .maybeSingle();

        if (!error && updatedUser) {
          return NextResponse.json({ ok: true, user: updatedUser });
        }
      }

      if (data.action === 'create_category') {
        const slug = data.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const { data: createdCat, error } = await supabase
          .from('categories')
          .insert({
            name: data.name.trim(),
            slug,
            description: data.description.trim(),
            icon_name: data.iconName,
            is_featured: false,
            is_active: true,
          })
          .select('id, name, slug, description, icon_name, is_active')
          .maybeSingle();

        if (!error && createdCat) {
          return NextResponse.json({ ok: true, category: createdCat });
        }
      }

      if (data.action === 'toggle_category' && isUuid(data.categoryId)) {
        const { data: updatedCat, error } = await supabase
          .from('categories')
          .update({ is_active: data.isActive })
          .eq('id', data.categoryId)
          .select('id, is_active')
          .maybeSingle();

        if (!error && updatedCat) {
          return NextResponse.json({ ok: true, category: updatedCat });
        }
      }

      if (data.action === 'moderate_review' && isUuid(data.reviewId)) {
        const { data: updatedRev, error } = await supabase
          .from('reviews')
          .update({ is_hidden: data.isHidden })
          .eq('id', data.reviewId)
          .select('id, is_hidden')
          .maybeSingle();

        if (!error && updatedRev) {
          return NextResponse.json({ ok: true, review: updatedRev });
        }
      }
    }
  }

  // Fallback preview store path
  if (data.action === 'review_verification') {
    const item = store.verifications.find((v) => v.id === data.verificationId);
    if (!item) {
      return NextResponse.json({ error: 'Verification record not found' }, { status: 404 });
    }
    item.status = data.decision;
    item.reviewedNotes =
      data.notes?.trim() ||
      (data.decision === 'verified'
        ? 'Identity & credentials verified by SkillNest Trust Team.'
        : 'Submission requires clearer documentation.');

    const provider = store.providers.find((p) => p.id === item.providerId);
    if (provider) {
      provider.verificationStatus = data.decision;
      provider.verificationNotes = item.reviewedNotes;
      if (data.decision === 'verified') {
        provider.ninVerified = true;
      }
    }
    return NextResponse.json({ ok: true, verification: item });
  }

  if (data.action === 'toggle_user_status') {
    const userRec = store.users.find((u) => u.user.id === data.userId);
    if (!userRec) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    userRec.user.isActive = data.isActive;
    return NextResponse.json({ ok: true, user: userRec.user });
  }

  if (data.action === 'create_category') {
    const slug = data.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (store.categories.some((c) => c.slug === slug)) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    const category = {
      id: generateId('cat'),
      name: data.name.trim(),
      slug,
      description: data.description.trim(),
      iconName: data.iconName,
      providerCount: 0,
      isFeatured: false,
      isActive: true,
    };
    store.categories.push(category);
    return NextResponse.json({ ok: true, category });
  }

  if (data.action === 'toggle_category') {
    const cat = store.categories.find((c) => c.id === data.categoryId);
    if (!cat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    cat.isActive = data.isActive;
    return NextResponse.json({ ok: true, category: cat });
  }

  if (data.action === 'moderate_review') {
    const provider = store.providers.find((p) => p.id === data.providerId);
    const review = provider?.reviews.find((r) => r.id === data.reviewId);
    if (!provider || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    review.isHidden = data.isHidden;
    const visible = provider.reviews.filter((r) => !r.isHidden);
    provider.reviewCount = visible.length;
    provider.ratingAvg =
      visible.length > 0
        ? Number((visible.reduce((s, r) => s + r.rating, 0) / visible.length).toFixed(1))
        : 5.0;
    return NextResponse.json({ ok: true, review });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
