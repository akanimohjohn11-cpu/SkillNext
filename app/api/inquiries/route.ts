import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { mapInquiryRow } from '@/lib/marketplace-data';
import { generateId, getStore } from '@/lib/marketplace-store';
import { isUuid } from '@/lib/supabase/config';
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { inquiryCreateSchema, inquiryMessageSchema } from '@/lib/validators';

const INQUIRY_SELECT = `
  id, provider_id, client_id, subject, budget_ngn, preferred_date, location, status, created_at, updated_at,
  profiles:client_id ( full_name ),
  provider_profiles:provider_id ( id, user_id, business_name, profiles:user_id ( full_name ) ),
  messages ( id, inquiry_id, sender_id, body, created_at, profiles:sender_id ( full_name, role ) )
`;

export async function GET() {
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (isSupabaseServerConfigured() && isUuid(session.id)) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('inquiries')
        .select(INQUIRY_SELECT)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({
          inquiries: data.map((row) => mapInquiryRow(row as Record<string, unknown>)),
        });
      }
    }
  }

  const store = getStore();
  const providerProfile = store.providers.find((p) => p.userId === session.id);

  const inquiries = store.inquiries.filter((inq) => {
    if (session.role === 'admin') return true;
    if (inq.clientId === session.id) return true;
    if (providerProfile && inq.providerId === providerProfile.id) return true;
    return false;
  });

  return NextResponse.json({ inquiries });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: 'Please sign in or create a free client account to message this provider' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = inquiryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid inquiry payload' },
      { status: 400 }
    );
  }

  if (
    isSupabaseServerConfigured() &&
    isUuid(session.id) &&
    isUuid(parsed.data.providerId)
  ) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: prov } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('id', parsed.data.providerId)
        .maybeSingle();

      if (!prov) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      const { data: createdInq, error: inqError } = await supabase
        .from('inquiries')
        .insert({
          provider_id: parsed.data.providerId,
          client_id: session.id,
          subject: parsed.data.subject.trim(),
          budget_ngn: parsed.data.budgetNgn ?? null,
          preferred_date: parsed.data.preferredDate || null,
          location: parsed.data.location.trim(),
          status: 'new',
        })
        .select('id')
        .single();

      if (inqError || !createdInq) {
        return NextResponse.json(
          { error: inqError?.message || 'Unable to create inquiry' },
          { status: 400 }
        );
      }

      const { error: msgError } = await supabase.from('messages').insert({
        inquiry_id: createdInq.id,
        sender_id: session.id,
        body: parsed.data.message.trim(),
      });

      if (msgError) {
        return NextResponse.json({ error: msgError.message }, { status: 400 });
      }

      const { data: hydrated } = await supabase
        .from('inquiries')
        .select(INQUIRY_SELECT)
        .eq('id', createdInq.id)
        .single();

      if (hydrated) {
        return NextResponse.json(
          { inquiry: mapInquiryRow(hydrated as Record<string, unknown>) },
          { status: 201 }
        );
      }
    }
  }

  const store = getStore();
  const provider = store.providers.find((p) => p.id === parsed.data.providerId);
  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const inquiryId = generateId('inq');
  const created = {
    id: inquiryId,
    providerId: provider.id,
    providerName: provider.fullName,
    providerBusiness: provider.businessName,
    clientId: session.id,
    clientName: session.fullName,
    subject: parsed.data.subject.trim(),
    budgetNgn: parsed.data.budgetNgn,
    preferredDate: parsed.data.preferredDate,
    location: parsed.data.location.trim(),
    status: 'new' as const,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: generateId('msg'),
        inquiryId,
        senderId: session.id,
        senderName: session.fullName,
        senderRole: session.role,
        body: parsed.data.message.trim(),
        createdAt: now,
      },
    ],
  };

  store.inquiries.unshift(created);
  return NextResponse.json({ inquiry: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = inquiryMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid message payload' },
      { status: 400 }
    );
  }

  if (
    isSupabaseServerConfigured() &&
    isUuid(session.id) &&
    isUuid(parsed.data.inquiryId)
  ) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: existing } = await supabase
        .from('inquiries')
        .select('id, client_id, status, provider_profiles:provider_id ( user_id )')
        .eq('id', parsed.data.inquiryId)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json({ error: 'Inquiry thread not found' }, { status: 404 });
      }

      const rawRel = existing.provider_profiles as unknown;
      const providerRel = (Array.isArray(rawRel) ? rawRel[0] : rawRel) as { user_id?: string } | null;
      const isParticipant =
        existing.client_id === session.id ||
        providerRel?.user_id === session.id ||
        session.role === 'admin';

      if (!isParticipant) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { error: msgError } = await supabase.from('messages').insert({
        inquiry_id: existing.id,
        sender_id: session.id,
        body: parsed.data.body.trim(),
      });

      if (msgError) {
        return NextResponse.json({ error: msgError.message }, { status: 400 });
      }

      const nextStatus =
        parsed.data.status ||
        (providerRel?.user_id === session.id && existing.status === 'new'
          ? 'replied'
          : undefined);

      if (nextStatus) {
        await supabase
          .from('inquiries')
          .update({ status: nextStatus })
          .eq('id', existing.id);
      }

      const { data: hydrated } = await supabase
        .from('inquiries')
        .select(INQUIRY_SELECT)
        .eq('id', existing.id)
        .single();

      if (hydrated) {
        return NextResponse.json({
          inquiry: mapInquiryRow(hydrated as Record<string, unknown>),
        });
      }
    }
  }

  const store = getStore();
  const inquiry = store.inquiries.find((i) => i.id === parsed.data.inquiryId);
  if (!inquiry) {
    return NextResponse.json({ error: 'Inquiry thread not found' }, { status: 404 });
  }

  const providerProfile = store.providers.find((p) => p.id === inquiry.providerId);
  const isParticipant =
    inquiry.clientId === session.id ||
    providerProfile?.userId === session.id ||
    session.role === 'admin';

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date().toISOString();
  inquiry.messages.push({
    id: generateId('msg'),
    inquiryId: inquiry.id,
    senderId: session.id,
    senderName: session.fullName,
    senderRole: session.role,
    body: parsed.data.body.trim(),
    createdAt: now,
  });

  if (parsed.data.status) {
    inquiry.status = parsed.data.status;
  } else if (providerProfile?.userId === session.id && inquiry.status === 'new') {
    inquiry.status = 'replied';
  }
  inquiry.updatedAt = now;

  return NextResponse.json({ inquiry });
}
