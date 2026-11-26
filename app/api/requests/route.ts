import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { mapServiceRequestRow } from '@/lib/marketplace-data';
import { generateId, getStore } from '@/lib/marketplace-store';
import { isUuid } from '@/lib/supabase/config';
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { serviceRequestSchema } from '@/lib/validators';

const REQUEST_SELECT = `
  id, client_id, title, description, location, budget_ngn, urgency, status, created_at,
  profiles:client_id ( full_name ),
  categories:category_id ( name, slug )
`;

export async function GET() {
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (isSupabaseServerConfigured() && isUuid(session.id)) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      let query = supabase
        .from('service_requests')
        .select(REQUEST_SELECT)
        .order('created_at', { ascending: false });

      if (session.role === 'client') {
        query = query.eq('client_id', session.id);
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({
          requests: data.map((row) => mapServiceRequestRow(row as Record<string, unknown>)),
        });
      }
    }
  }

  const store = getStore();
  const requests =
    session.role === 'client'
      ? store.requests.filter((r) => r.clientId === session.id)
      : store.requests;

  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Please sign in to post a service request' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = serviceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid service request' },
      { status: 400 }
    );
  }

  if (isSupabaseServerConfigured() && isUuid(session.id)) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', parsed.data.categorySlug)
        .maybeSingle();

      const { data: inserted, error } = await supabase
        .from('service_requests')
        .insert({
          client_id: session.id,
          category_id: cat?.id ?? null,
          title: parsed.data.title.trim(),
          description: parsed.data.description.trim(),
          location: parsed.data.location.trim(),
          budget_ngn: parsed.data.budgetNgn,
          urgency: parsed.data.urgency,
          status: 'open',
        })
        .select(REQUEST_SELECT)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(
        { request: mapServiceRequestRow(inserted as Record<string, unknown>) },
        { status: 201 }
      );
    }
  }

  const store = getStore();
  const category =
    store.categories.find((c) => c.slug === parsed.data.categorySlug) || store.categories[0];

  const created = {
    id: generateId('req'),
    clientId: session.id,
    clientName: session.fullName,
    title: parsed.data.title.trim(),
    categorySlug: category.slug,
    categoryName: category.name,
    description: parsed.data.description.trim(),
    location: parsed.data.location.trim(),
    budgetNgn: parsed.data.budgetNgn,
    urgency: parsed.data.urgency,
    status: 'open' as const,
    responsesCount: 0,
    createdAt: new Date().toISOString(),
  };

  store.requests.unshift(created);
  return NextResponse.json({ request: created }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['open', 'in_review', 'assigned', 'completed', 'cancelled']),
});

export async function PATCH(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
  }

  if (isSupabaseServerConfigured() && isUuid(session.id) && isUuid(parsed.data.id)) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: existing } = await supabase
        .from('service_requests')
        .select('id, client_id')
        .eq('id', parsed.data.id)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }
      if (existing.client_id !== session.id && session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: updated, error } = await supabase
        .from('service_requests')
        .update({ status: parsed.data.status })
        .eq('id', parsed.data.id)
        .select(REQUEST_SELECT)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({
        request: mapServiceRequestRow(updated as Record<string, unknown>),
      });
    }
  }

  const store = getStore();
  const target = store.requests.find((r) => r.id === parsed.data.id);
  if (!target) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (target.clientId !== session.id && session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  target.status = parsed.data.status;
  return NextResponse.json({ request: target });
}
