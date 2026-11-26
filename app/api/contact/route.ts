import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginMutation } from '@/lib/auth-session';
import { generateId, getStore } from '@/lib/marketplace-store';
import { contactSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please complete all required fields' },
      { status: 400 }
    );
  }

  const store = getStore();
  const submission = {
    id: generateId('cnt'),
    name: parsed.data.name.trim(),
    email: parsed.data.email.trim().toLowerCase(),
    phone: parsed.data.phone.trim(),
    topic: parsed.data.topic.trim(),
    message: parsed.data.message.trim(),
    createdAt: new Date().toISOString(),
  };

  store.contacts.unshift(submission);
  return NextResponse.json({ ok: true, submission }, { status: 201 });
}
