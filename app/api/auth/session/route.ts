import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getClearSessionCookieConfig,
  getCurrentSessionUser,
  getSessionCookieConfig,
  hashPassword,
  isSameOriginMutation,
  SessionUser,
  signSessionToken,
  verifyPassword,
} from '@/lib/auth-session';
import { GENERATED_IMAGES } from '@/lib/constants';
import { generateId, getStore } from '@/lib/marketplace-store';
import { ensureSupabaseProviderProfile } from '@/lib/marketplace-data';
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/lib/validators';

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('login'),
    email: loginSchema.shape.email,
    password: loginSchema.shape.password,
  }),
  z.object({
    action: z.literal('signup'),
    fullName: signupSchema.shape.fullName,
    email: signupSchema.shape.email,
    phone: signupSchema.shape.phone,
    password: signupSchema.shape.password,
    role: signupSchema.shape.role,
    location: signupSchema.shape.location,
    businessName: signupSchema.shape.businessName,
    categorySlug: signupSchema.shape.categorySlug,
    headline: signupSchema.shape.headline,
  }),
  z.object({
    action: z.literal('preview_role'),
    role: z.enum(['client', 'provider']),
  }),
]);

export async function GET() {
  const user = await getCurrentSessionUser();
  return NextResponse.json({
    user,
    supabaseConfigured: isSupabaseServerConfigured(),
  });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const store = getStore();

  // Supabase Auth path when configured
  if (isSupabaseServerConfigured() && data.action !== 'preview_role') {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      if (data.action === 'login') {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error || !authData.user) {
          return NextResponse.json(
            { error: error?.message || 'Invalid credentials' },
            { status: 401 }
          );
        }
        const meta = (authData.user.user_metadata ?? {}) as Record<string, string>;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role, location, is_active')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profile && profile.is_active === false) {
          await supabase.auth.signOut();
          return NextResponse.json(
            { error: 'This account has been suspended' },
            { status: 403 }
          );
        }

        const role =
          (profile?.role as SessionUser['role']) ||
          (meta.role as SessionUser['role']) ||
          'client';
        const fullName =
          (profile?.full_name as string) || meta.full_name || data.email.split('@')[0];
        const location = (profile?.location as string) || meta.location || 'Lagos';

        if (role === 'provider') {
          await ensureSupabaseProviderProfile({
            userId: authData.user.id,
            fullName,
            location,
            businessName: meta.business_name,
            categorySlug: meta.category_slug,
            headline: meta.headline,
          });
        }

        const user: SessionUser = {
          id: authData.user.id,
          email: authData.user.email ?? data.email,
          fullName,
          role,
          location,
        };
        return NextResponse.json({ user });
      }

      if (data.action === 'signup') {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              phone: data.phone,
              role: data.role,
              location: data.location,
              business_name: data.businessName,
              category_slug: data.categorySlug,
              headline: data.headline,
            },
          },
        });
        if (error || !authData.user) {
          return NextResponse.json(
            { error: error?.message || 'Unable to create account' },
            { status: 400 }
          );
        }

        if (authData.session) {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: data.email.trim().toLowerCase(),
            full_name: data.fullName.trim(),
            phone: data.phone.trim(),
            role: data.role,
            location: data.location.trim(),
          });

          if (data.role === 'provider') {
            await ensureSupabaseProviderProfile({
              userId: authData.user.id,
              fullName: data.fullName.trim(),
              location: data.location.trim(),
              businessName: data.businessName,
              categorySlug: data.categorySlug,
              headline: data.headline,
            });
          }
        }

        const user: SessionUser = {
          id: authData.user.id,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          location: data.location,
        };
        return NextResponse.json(
          { user, needsEmailConfirmation: !authData.session },
          { status: 201 }
        );
      }
    }
  }

  // Server-backed preview & local session path
  if (data.action === 'preview_role') {
    if (isSupabaseServerConfigured()) {
      return NextResponse.json(
        { error: 'Quick preview sign-in is disabled when production Supabase is active' },
        { status: 403 }
      );
    }
    const targetEmail =
      data.role === 'client'
        ? 'tunde.balogun@skillnest.ng'
        : 'amara.okafor@skillnest.ng';
    const record = store.users.find((u) => u.user.email === targetEmail);
    if (!record) {
      return NextResponse.json({ error: 'Account unavailable' }, { status: 404 });
    }
    const sessionUser: SessionUser = {
      id: record.user.id,
      email: record.user.email,
      fullName: record.user.fullName,
      role: record.user.role,
      location: record.user.location,
    };
    const token = signSessionToken(sessionUser);
    const res = NextResponse.json({ user: sessionUser });
    res.cookies.set(getSessionCookieConfig(token));
    return res;
  }

  if (data.action === 'login') {
    const emailLower = data.email.trim().toLowerCase();
    const record = store.users.find((u) => u.user.email.toLowerCase() === emailLower);
    if (!record || !verifyPassword(data.password, record.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    if (!record.user.isActive) {
      return NextResponse.json({ error: 'This account has been suspended' }, { status: 403 });
    }
    const sessionUser: SessionUser = {
      id: record.user.id,
      email: record.user.email,
      fullName: record.user.fullName,
      role: record.user.role,
      location: record.user.location,
    };
    const token = signSessionToken(sessionUser);
    const res = NextResponse.json({ user: sessionUser });
    res.cookies.set(getSessionCookieConfig(token));
    return res;
  }

  // Signup
  const emailLower = data.email.trim().toLowerCase();
  if (store.users.some((u) => u.user.email.toLowerCase() === emailLower)) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 }
    );
  }

  const userId = generateId(`user-${data.role}`);
  const newUser = {
    id: userId,
    email: emailLower,
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    role: data.role,
    location: data.location.trim(),
    createdAt: new Date().toISOString(),
    isActive: true,
    avatarUrl: data.role === 'provider' ? GENERATED_IMAGES.techPortrait : undefined,
  };

  store.users.push({
    user: newUser,
    passwordHash: hashPassword(data.password),
  });

  if (data.role === 'provider') {
    const category =
      store.categories.find((c) => c.slug === data.categorySlug) || store.categories[1];
    store.providers.unshift({
      id: generateId('prov'),
      userId,
      fullName: newUser.fullName,
      businessName: data.businessName?.trim() || `${newUser.fullName} Studio`,
      headline: data.headline?.trim() || `Verified ${category.name} Specialist in ${newUser.location}`,
      bio: `Independent ${category.name.toLowerCase()} professional serving clients across ${newUser.location}. Reach out with your project brief for a clear scope and Naira estimate.`,
      categorySlug: category.slug,
      categoryName: category.name,
      skills: [category.name, 'Consultation', 'Project Delivery'],
      location: newUser.location,
      serviceAreas: [newUser.location],
      avatarUrl: GENERATED_IMAGES.techPortrait,
      startingPriceNgn: 50000,
      yearsExperience: 3,
      responseTime: 'Within 3 hours',
      completedJobs: 0,
      ratingAvg: 5.0,
      reviewCount: 0,
      verificationStatus: 'unverified',
      cacRegistered: false,
      ninVerified: false,
      isFeatured: false,
      services: [
        {
          id: generateId('srv'),
          providerId: '',
          title: `${category.name} Discovery Consultation`,
          description: 'Initial site or project assessment and written Naira quotation.',
          priceNgn: 50000,
          priceUnit: 'fixed',
          deliveryEstimate: '48 hours',
        },
      ],
      portfolio: [],
      reviews: [],
      createdAt: new Date().toISOString(),
    });
    store.providers[0].services[0].providerId = store.providers[0].id;
  }

  const sessionUser: SessionUser = {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.fullName,
    role: newUser.role,
    location: newUser.location,
  };
  const token = signSessionToken(sessionUser);
  const res = NextResponse.json({ user: sessionUser }, { status: 201 });
  res.cookies.set(getSessionCookieConfig(token));
  return res;
}

export async function DELETE(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  if (isSupabaseServerConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase?.auth.signOut();
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getClearSessionCookieConfig());
  return res;
}
