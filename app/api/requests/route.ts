import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { generateId, getStore } from '@/lib/marketplace-store';
import { serviceRequestSchema } from '@/lib/validators';

export async function GET() {
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
