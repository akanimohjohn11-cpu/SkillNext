import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { generateId, getStore } from '@/lib/marketplace-store';
import { inquiryCreateSchema, inquiryMessageSchema } from '@/lib/validators';

export async function GET() {
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
